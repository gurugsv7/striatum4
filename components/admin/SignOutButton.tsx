import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/actions/auth';

/** Server-rendered sign-out control — no client JS required. */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line-200 px-3 text-[13px] font-medium text-ice-300 transition-colors hover:border-danger/50 hover:text-danger"
      >
        <LogOut className="size-3.5" aria-hidden="true" />
        Sign out
      </button>
    </form>
  );
}
