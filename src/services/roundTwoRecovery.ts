export type FileKind = 'abstract' | 'payment';
export type UploadRecord = { path: string; name: string; size: number; mime: string; at: number; confirmed: boolean };
type Journal = Record<string, Partial<Record<FileKind, UploadRecord>>>;
const prefix = 'striatum-r2-uploads-v1:';
// Only metadata for immutable server objects, never file bytes or credentials.
// Tab-scoped, expires after a day, and purged on sign-out/account switch.
export function readUploads(uid: string): Journal {
  try {
    const value = JSON.parse(sessionStorage.getItem(prefix + uid) ?? '{}') as Journal;
    const result: Journal = {};
    for (const [id, files] of Object.entries(value)) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) continue;
      for (const kind of ['abstract', 'payment'] as const) {
        const r = files?.[kind];
        if (r && typeof r.path === 'string' && r.path.startsWith(`${uid}/${id}/`) && r.path.split('/').length === 3
          && typeof r.name === 'string' && r.name.length <= 240 && typeof r.mime === 'string'
          && r.size > 0 && r.size <= 10485760 && r.at > Date.now() - 86400000) {
          (result[id] ??= {})[kind] = r;
        }
      }
    }
    return result;
  } catch { return {}; }
}
export function writeUpload(uid: string, id: string, kind: FileKind, record?: UploadRecord): void {
  try {
    const journal = readUploads(uid);
    if (record) (journal[id] ??= {})[kind] = record;
    else if (journal[id]) delete journal[id][kind];
    sessionStorage.setItem(prefix + uid, JSON.stringify(journal));
  } catch { /* Private mode/quota must not prevent an in-memory upload. */ }
}
export function forgetUploads(uid: string, id: string): void {
  try { const journal = readUploads(uid); delete journal[id]; sessionStorage.setItem(prefix + uid, JSON.stringify(journal)); } catch { /* best effort */ }
}
export function clearUploadRecovery(): void {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i); if (key?.startsWith(prefix)) sessionStorage.removeItem(key);
    }
  } catch { /* best effort */ }
}
