/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Organiser passcode for the /admin console. See .env.example. */
  readonly VITE_ADMIN_PASSCODE?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
