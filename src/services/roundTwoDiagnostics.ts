// Deliberately excludes URLs, object paths, filenames, file contents, identities,
// headers and error messages (which may contain signed URLs or JWTs).
type Diagnostic = { at: string; phase: string; outcome: string; ms?: number; status?: number; requestId?: string; bytes?: number; mime?: string };
const events: Diagnostic[] = [];
export function recordRoundTwo(event: Omit<Diagnostic, 'at'>): void {
  events.push({ at: new Date().toISOString(), ...event });
  if (events.length > 60) events.shift();
}
export function clearRoundTwoDiagnostics(): void { events.length = 0; }
export function roundTwoDiagnosticReport(): string {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  return JSON.stringify({ version: 1, build: 'r2-buffer-v1', platform: /Android/i.test(ua) ? 'android' : /iPhone|iPad/i.test(ua) ? 'ios' : 'desktop',
    browser: /SamsungBrowser/i.test(ua) ? 'samsung' : /; wv\)/i.test(ua) ? 'webview' : /Chrome/i.test(ua) ? 'chromium' : /Safari/i.test(ua) ? 'safari' : 'other',
    online: typeof navigator === 'undefined' ? null : navigator.onLine, visibility: typeof document === 'undefined' ? null : document.visibilityState, events }, null, 2);
}
export const roundTwoFetch: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  const storage = url.pathname.includes('/storage/v1/') && /round-two-(abstracts|payments)/.test(url.pathname);
  const rpc = /\/rest\/v1\/rpc\/(submit_round_two|start_round_two|remove_draft_round_two|round_two_roster)$/.test(url.pathname);
  const entries = /\/rest\/v1\/round_two_entries$/.test(url.pathname);
  if (!storage && !rpc && !entries) return fetch(input, init);
  const phase = entries ? 'load-entries' : rpc ? url.pathname.split('/').pop()! : url.pathname.includes('/upload/sign/') ? (url.searchParams.has('token') ? 'signed-upload' : 'sign-upload')
    : url.pathname.includes('/list/') ? 'verify-object' : url.pathname.includes('/upload/') ? 'sign-upload' : 'upload';
  const started = performance.now();
  const controller = new AbortController();
  const upstream = init?.signal ?? (input instanceof Request ? input.signal : null);
  const abort = () => controller.abort();
  if (upstream?.aborted) abort();
  upstream?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 90000);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    // These endpoints return small JSON responses. Include response-body reads
    // in the deadline too; losing the reply after HTTP 200 is still uncertain.
    await response.clone().arrayBuffer();
    const id = response.headers.get('sb-request-id');
    recordRoundTwo({ phase, outcome: response.ok ? 'ok' : 'http-error', status: response.status, ms: Math.round(performance.now() - started),
      ...(id && /^[a-zA-Z0-9-]{1,80}$/.test(id) ? { requestId: id } : {}) });
    return response;
  } catch (error) {
    recordRoundTwo({ phase, outcome: controller.signal.aborted ? 'aborted-or-timeout' : error instanceof TypeError ? 'fetch-type-error' : 'request-error', ms: Math.round(performance.now() - started) });
    throw error;
  } finally { clearTimeout(timer); upstream?.removeEventListener('abort', abort); }
};
