import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root — an unrelated lockfile higher up the tree
  // otherwise makes Next.js guess the wrong monorepo root.
  outputFileTracingRoot: path.join(__dirname),
  // The existing Vercel project uses the Vite-era variable names. Expose
  // those same values under the names consumed by this Next.js app so auth
  // works without renaming production secrets.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
};

export default nextConfig;
