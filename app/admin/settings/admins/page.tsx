import { redirect } from 'next/navigation';
import { AuthError, requireAdmin } from '@/lib/auth/guards';
import { listAdminUsers } from '@/lib/queries/admin';
import { AdminUsersPanel } from '@/components/admin/AdminUsersPanel';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  let admin;
  try {
    admin = await requireAdmin(['SUPER_ADMIN']);
  } catch (err) {
    if (err instanceof AuthError) {
      // A signed-in admin without SUPER_ADMIN simply can't see this screen —
      // send them back to the console rather than the sign-in redirect the
      // outer layout uses for non-admins.
      redirect('/admin');
    }
    throw err;
  }

  const admins = await listAdminUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] text-ice-100">Settings — Admins</h1>
        <p className="mt-1 text-[14px] text-ice-500">
          Grant or change operations console access. Only Super Admins can reach this screen.
        </p>
      </div>

      <AdminUsersPanel admins={admins} currentAdminId={admin.id} />
    </div>
  );
}
