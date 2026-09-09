import { Session, User } from '@supabase/supabase-js';
import { supabase, GOOGLE_CLIENT_ID } from './supabaseClient.ts';

/* ============================================================================
 * Authentication.
 *
 * Google sign-in uses Google Identity Services directly in the page and hands
 * the resulting ID token to Supabase via signInWithIdToken(). That matters for
 * two reasons:
 *
 *   1. There is no redirect to <project>.supabase.co, so Google's consent sheet
 *      names OUR domain rather than the Supabase project host.
 *   2. Supabase still issues a real session, so auth.uid() is populated and
 *      every RLS policy and RPC keeps working. Managing the session ourselves
 *      would leave auth.uid() null and the whole authoritative backend would
 *      refuse every read and write.
 * ========================================================================== */

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

type AuthListener = (user: AuthUser | null) => void;
const listeners = new Set<AuthListener>();

let currentUser: AuthUser | null = null;
let initialised = false;

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: typeof meta.full_name === 'string' ? meta.full_name : undefined,
    avatarUrl: typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined
  };
}

function emit(): void {
  listeners.forEach(fn => fn(currentUser));
}

export function onAuthChange(fn: AuthListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

export function isSignedIn(): boolean {
  return currentUser !== null;
}

/** Restores any persisted session and subscribes to future auth changes. */
export async function initAuth(): Promise<AuthUser | null> {
  if (!supabase || initialised) return currentUser;
  initialised = true;

  const { data } = await supabase.auth.getSession();
  currentUser = toAuthUser(data.session?.user ?? null);
  emit();

  supabase.auth.onAuthStateChange((_event, session: Session | null) => {
    currentUser = toAuthUser(session?.user ?? null);
    emit();
  });

  return currentUser;
}

/* ------------------------------------------------------- Google sign-in ---- */

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  prompt(): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let gsiPromise: Promise<boolean> | null = null;

/** Loads Google Identity Services once. Resolves false when unavailable. */
export function loadGoogleIdentity(): Promise<boolean> {
  if (!GOOGLE_CLIENT_ID) return Promise.resolve(false);
  if (gsiPromise) return gsiPromise;

  gsiPromise = new Promise<boolean>(resolve => {
    if (window.google?.accounts?.id) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.google?.accounts?.id)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(Boolean(window.google?.accounts?.id));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return gsiPromise;
}

export interface GoogleSignInResult {
  ok: boolean;
  message?: string;
  user?: AuthUser;
}

/**
 * Renders Google's own sign-in button into `container`.
 *
 * The button must be Google-rendered: their branding terms do not allow a
 * custom-drawn button issuing real credentials. We control size and theme only.
 */
export async function renderGoogleButton(
  container: HTMLElement,
  onResult: (result: GoogleSignInResult) => void
): Promise<boolean> {
  if (!supabase) {
    onResult({ ok: false, message: 'Sign-in is not configured on this deployment.' });
    return false;
  }
  const ready = await loadGoogleIdentity();
  if (!ready || !window.google) return false;

  // Local non-null ref so the async callback below does not re-narrow.
  const client = supabase;

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    cancel_on_tap_outside: true,
    callback: async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        onResult({ ok: false, message: 'Google sign-in was cancelled.' });
        return;
      }
      const { data, error } = await client.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential
      });
      if (error) {
        onResult({ ok: false, message: error.message });
        return;
      }
      currentUser = toAuthUser(data.user);
      emit();
      onResult({ ok: true, user: currentUser ?? undefined });
    }
  });

  container.innerHTML = '';
  window.google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'left',
    width: container.clientWidth || 320
  });

  return true;
}

/* -------------------------------------------------------- email sign-in ---- */

export interface EmailSignInResult {
  ok: boolean;
  message: string;
}

/**
 * Sends a one-time sign-in link. No password is ever collected or stored — the
 * delegate proves control of the address they registered with.
 */
export async function signInWithEmail(email: string): Promise<EmailSignInResult> {
  if (!supabase) return { ok: false, message: 'Sign-in is not configured on this deployment.' };

  const trimmed = email.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { ok: false, message: 'That email address does not look right.' };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: { emailRedirectTo: window.location.origin }
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Check ' + trimmed + ' for your sign-in link.' };
}

export async function signOut(): Promise<void> {
  window.google?.accounts.id.disableAutoSelect();
  if (supabase) await supabase.auth.signOut();
  currentUser = null;
  emit();
}
