'use client';

/**
 * STRIATUM 4.0 admin — Settings → Admins (SUPER_ADMIN only).
 *
 * Grants admin access to an existing account by email (addAdminUser), lets a
 * Super Admin change or remove a role (updateAdminUserRole / removeAdminUser
 * in lib/actions/admin.ts). The very first admin still has to be inserted by
 * SQL — see README.md — since this screen itself requires SUPER_ADMIN access
 * to reach.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { addAdminUser, removeAdminUser, updateAdminUserRole } from '@/lib/actions/admin';
import type { AdminUserWithProfile } from '@/lib/queries/admin';
import { ADMIN_ROLE_LABELS, type AdminRole } from '@/lib/types/enums';
import { Panel } from '@/components/ui/Panel';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { formatDateTime } from '@/lib/format/date';

const ROLE_OPTIONS = (Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map((value) => ({
  value,
  label: ADMIN_ROLE_LABELS[value],
}));

export interface AdminUsersPanelProps {
  admins: AdminUserWithProfile[];
  currentAdminId: string;
}

export function AdminUsersPanel({ admins, currentAdminId }: AdminUsersPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('REVIEWER');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string | undefined>>({});
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminUserWithProfile | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!email.trim()) {
      setAddError('Enter an email address.');
      return;
    }
    setAdding(true);
    try {
      const result = await addAdminUser({ email: email.trim(), role });
      if (!result.ok) {
        setAddError(result.error);
        return;
      }
      setEmail('');
      setRole('REVIEWER');
      router.refresh();
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (userId: string, nextRole: AdminRole) => {
    setRowError((prev) => ({ ...prev, [userId]: undefined }));
    setPendingUserId(userId);
    try {
      const result = await updateAdminUserRole({ userId, role: nextRole });
      if (!result.ok) {
        setRowError((prev) => ({ ...prev, [userId]: result.error }));
        return;
      }
      router.refresh();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    const result = await removeAdminUser({ userId: removeTarget.userId });
    if (!result.ok) {
      setRowError((prev) => ({ ...prev, [removeTarget.userId]: result.error }));
      setRemoveTarget(null);
      return;
    }
    setRemoveTarget(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-4">
        <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">Add an admin</h3>
        <p className="text-[13px] text-ice-500">
          The person must have signed in at least once already — this grants an existing account admin access, it
          does not create one.
        </p>
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Email" htmlFor="admin-email" className="flex-1">
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </Field>
          <Field label="Role" htmlFor="admin-role" className="sm:w-48">
            <Select
              id="admin-role"
              options={ROLE_OPTIONS}
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
            />
          </Field>
          <Button type="submit" loading={adding} className="sm:w-fit">
            <UserPlus className="size-4" aria-hidden="true" />
            Add admin
          </Button>
        </form>
        {addError ? (
          <p role="alert" className="text-[13px] font-medium text-danger">
            {addError}
          </p>
        ) : null}
      </Panel>

      <div className="flex flex-col gap-3">
        <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ice-500">
          Admins ({admins.length})
        </h3>
        <div className="flex flex-col gap-2">
          {admins.map((admin) => (
            <Panel key={admin.userId} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[15px] font-medium text-ice-100">
                  {admin.fullName?.trim() || admin.email || 'Unknown account'}
                  {admin.userId === currentAdminId ? (
                    <span className="ml-2 text-[12px] font-normal text-ice-500">(you)</span>
                  ) : null}
                </span>
                <span className="truncate text-[13px] text-ice-500">{admin.email ?? '—'}</span>
                <span className="text-[12px] text-ice-700">Added {formatDateTime(admin.createdAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  options={ROLE_OPTIONS}
                  value={admin.role}
                  disabled={pendingUserId === admin.userId}
                  onChange={(e) => handleRoleChange(admin.userId, e.target.value as AdminRole)}
                  className="h-9 w-40 text-[13px]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoveTarget(admin)}
                  disabled={pendingUserId === admin.userId}
                >
                  Remove
                </Button>
              </div>

              {rowError[admin.userId] ? (
                <p role="alert" className="text-[13px] font-medium text-danger sm:basis-full">
                  {rowError[admin.userId]}
                </p>
              ) : null}
            </Panel>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove admin access?"
        description={
          removeTarget
            ? `${removeTarget.fullName?.trim() || removeTarget.email || 'This person'} will lose access to the operations console immediately.`
            : undefined
        }
        confirmLabel="Remove"
        tone="destructive"
        onConfirm={handleRemove}
      />
    </div>
  );
}
