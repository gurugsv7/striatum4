/**
 * STRIATUM 4.0 — auth/authorization guards.
 *
 * These are the single source of truth for "who is this and are they
 * allowed to do X" across Server Components, server actions, and route
 * handlers. Middleware performs the same checks as a *first* gate for
 * page navigation only — every server action and Server Component must
 * still call these directly (see docs/03-ARCHITECTURE.md §3).
 */
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AdminRole, DelegateApplicationStatus } from '@/lib/types/enums';
import type { DelegateRow, ProfileRow } from '@/lib/types/database';

// ---------------------------------------------------------------------------
// Typed errors
// ---------------------------------------------------------------------------
export type AuthErrorCode = 'UNAUTHENTICATED' | 'NOT_ADMIN' | 'NOT_DELEGATE' | 'PROFILE_MISSING';
export const FINANCE_ADMIN_EMAIL = 'financesigma26@gmail.com';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/**
 * Thrown by requireDelegate() when the caller is authenticated but has no
 * ACTIVE delegate row yet. Carries the current delegate-application status
 * (if any) so callers can render the right CTA instead of a bare error.
 */
export class NotDelegateError extends AuthError {
  applicationStatus: DelegateApplicationStatus | null;

  constructor(applicationStatus: DelegateApplicationStatus | null) {
    super('NOT_DELEGATE', 'No active delegate for this user.');
    this.name = 'NotDelegateError';
    this.applicationStatus = applicationStatus;
  }
}

// ---------------------------------------------------------------------------
// requireUser / getOptionalUser
// ---------------------------------------------------------------------------
export interface AuthedUser {
  id: string;
  email: string;
  profile: ProfileRow;
}

export async function getOptionalUser(): Promise<AuthedUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  if (!profile) return null;

  return { id: user.id, email: user.email ?? profile.email, profile };
}

export async function requireUser(): Promise<AuthedUser> {
  const user = await getOptionalUser();
  if (!user) {
    throw new AuthError('UNAUTHENTICATED', 'Sign in required.');
  }
  return user;
}

// ---------------------------------------------------------------------------
// requireAdmin
// ---------------------------------------------------------------------------
export interface AuthedAdmin extends AuthedUser {
  role: AdminRole;
}

export async function requireAdmin(roles?: AdminRole[]): Promise<AuthedAdmin> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    throw new AuthError('NOT_ADMIN', 'Admin access required.');
  }
  if (roles && roles.length > 0 && !roles.includes(adminRow.role)) {
    throw new AuthError('NOT_ADMIN', `Admin role ${adminRow.role} is not permitted for this action.`);
  }

  return { ...user, role: adminRow.role };
}

/** Payment evidence and finance mutations are restricted to the finance account. */
export async function requireFinanceAdmin(): Promise<AuthedAdmin> {
  const admin = await requireAdmin();
  if (admin.email.toLowerCase() !== FINANCE_ADMIN_EMAIL) {
    throw new AuthError('NOT_ADMIN', 'Finance access required.');
  }
  return admin;
}

// ---------------------------------------------------------------------------
// requireDelegate
// ---------------------------------------------------------------------------
export interface AuthedDelegate extends AuthedUser {
  delegate: DelegateRow;
}

export async function requireDelegate(): Promise<AuthedDelegate> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: delegate } = await supabase
    .from('delegates')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!delegate) {
    const { data: application } = await supabase
      .from('delegate_applications')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    throw new NotDelegateError(application?.status ?? null);
  }

  return { ...user, delegate };
}

// ---------------------------------------------------------------------------
// getDelegateState — single discriminated union describing the delegate
// journey. Drives the Home card, event-detail CTA, and profile screen.
// Deliberately cheap: at most two queries (delegates, then
// delegate_applications only if no active delegate row exists).
// ---------------------------------------------------------------------------
export type DelegateState =
  | { status: 'NONE' }
  | { status: 'DRAFT' }
  | { status: 'PAYMENT_PENDING' }
  | { status: 'PAYMENT_UNDER_REVIEW' }
  | { status: 'PAYMENT_REJECTED'; reason: string | null }
  | { status: 'ACTIVE'; delegate: DelegateRow };

export async function getDelegateState(userId: string): Promise<DelegateState> {
  const supabase = await createSupabaseServerClient();

  const { data: delegate } = await supabase
    .from('delegates')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (delegate) {
    return { status: 'ACTIVE', delegate };
  }

  const { data: application } = await supabase
    .from('delegate_applications')
    .select('status, rejection_reason')
    .eq('user_id', userId)
    .maybeSingle();

  if (!application) {
    return { status: 'NONE' };
  }

  switch (application.status) {
    case 'DRAFT':
      return { status: 'DRAFT' };
    case 'PAYMENT_PENDING':
      return { status: 'PAYMENT_PENDING' };
    case 'PAYMENT_UNDER_REVIEW':
      return { status: 'PAYMENT_UNDER_REVIEW' };
    case 'PAYMENT_REJECTED':
      return { status: 'PAYMENT_REJECTED', reason: application.rejection_reason };
    case 'APPROVED':
      // Application says approved but no ACTIVE delegates row was found
      // above (e.g. revoked). Treat as NONE rather than lying about state.
      return { status: 'NONE' };
    default:
      return { status: 'NONE' };
  }
}
