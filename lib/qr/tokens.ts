/**
 * STRIATUM 4.0 — server-only token generation.
 *
 * Token generation is server-side only. In the normal flow, tokens are
 * generated inside the SECURITY DEFINER SQL functions via random_token(32)
 * (Postgres gen_random_bytes(32), base64url-encoded — see
 * supabase/migrations/0002_functions.sql). This module exists for the rare
 * case TypeScript must generate a token itself (never client-side, never
 * Math.random()) — it mirrors random_token(32)'s output shape exactly.
 *
 * IMPORTANT: the delegate verification_token space and the qr_credentials
 * token space are never interchangeable. A token minted here for one must
 * never be written into the other's column. See lib/qr/render.ts for the
 * two QR payload shapes.
 */
import 'server-only';
import { randomBytes } from 'node:crypto';

/** base64url, no padding — same alphabet as the SQL random_token() helper. */
export function generateToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('base64url');
}
