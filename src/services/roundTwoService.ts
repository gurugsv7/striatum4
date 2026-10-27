import { supabase } from './supabaseClient.ts';
import { loadExtraAbstracts, clearExtraAbstracts } from './extraAbstractService.ts';
import { getCurrentUser } from './authService.ts';
import type { EventRegistrationIntent } from './registrationForm.ts';
import { toServerTeams } from './registrationForm.ts';
import { recordRoundTwo, clearRoundTwoDiagnostics } from './roundTwoDiagnostics.ts';
import { readUploads, writeUpload, forgetUploads, clearUploadRecovery, type FileKind, type UploadRecord } from './roundTwoRecovery.ts';

export type ReviewStatus = 'draft' | 'under_review' | 'approved' | 'rejected';
export interface RoundTwoAttempt {
  id: string; entry_id: string; attempt_number: number;
  abstract_path: string; abstract_name: string; proof_path: string;
  payment_status: ReviewStatus; submission_status: ReviewStatus;
  payment_reason: string | null; submission_reason: string | null;
  submitted_at: string;
}
export interface RoundTwoEntry {
  id: string; registration_id: string; user_id: string; event_id: string; fee: number;
  payment_status: ReviewStatus; submission_status: ReviewStatus;
  round_two_attempts: RoundTwoAttempt[];
}
let entries: RoundTwoEntry[] = [];
const staged = new Map<string, { abstract?: File; payment?: File }>();
// Keep confirmed uploads in memory across form retries. A failed proof upload or
// final RPC must not force participants to send the same abstract again.
const uploaded = new Map<string, Partial<Record<FileKind, UploadRecord>>>();
const preparing = new Map<string, Promise<void>>();
const operations = new Map<string, { busy: boolean; progress: string; error: string }>();
const reviewDrafts = new Map<string, { reason: string; error: string; busy: boolean }>();
async function withDeadline<T>(task: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try { return await Promise.race([task, new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})]); }
  finally { clearTimeout(timer!); }
}
const readFileBytes = (file: File) => withDeadline(file.arrayBuffer(),30000,'File read timed out');
export function roundTwoReviewDraft(id: string, kind: string) {
  const key = `${id}:${kind}`;
  if (!reviewDrafts.has(key)) reviewDrafts.set(key, { reason: '', error: '', busy: false });
  return reviewDrafts.get(key)!;
}
export function roundTwoOperation(id: string) { return operations.get(id) ?? { busy: false, progress: '', error: '' }; }
function operation(id: string, value: ReturnType<typeof roundTwoOperation>): void {
  operations.set(id, value);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('striatum:r2-state'));
}
export function recoverableFile(id: string, kind: FileKind): UploadRecord | undefined {
  const uid = getCurrentUser()?.id;
  return uploaded.get(id)?.[kind] ?? (uid ? readUploads(uid)[id]?.[kind] : undefined);
}
export function hasRoundTwoFile(id: string, kind: FileKind): boolean { return Boolean(stagedFiles(id)[kind] || recoverableFile(id, kind)); }
export function stagedFiles(id: string): { abstract?: File; payment?: File } { return staged.get(id) ?? {}; }
export async function stageFile(id: string, kind: FileKind, file?: File): Promise<void> {
  if (roundTwoOperation(id).busy) return;
  const uid = getCurrentUser()?.id;
  if (!uid) throw new Error('Sign in to select files.');
  const ticket = generation;
  const key = `${id}:${kind}`;
  const saved = uploaded.get(id); if (saved) delete saved[kind];
  writeUpload(uid, id, kind);
  staged.set(id, { ...stagedFiles(id), [kind]: undefined });
  operation(id, { busy: false, progress: file ? 'Preparing file…' : '', error: '' });
  let task!: Promise<void>;
  task = (async () => {
    if (!file) return;
    validateRoundTwoFile(file, kind);
    const mime = roundTwoMime(file);
    try {
      // Read immediately while the picker grant is valid. A native File can
      // become unreadable after returning from a UPI app or cloud provider.
      const bytes = await readFileBytes(file);
      if (bytes.byteLength !== file.size) throw new Error('Incomplete file');
      if (ticket !== generation || getCurrentUser()?.id !== uid || preparing.get(key) !== task) return;
      const snapshot = new File([bytes], file.name, { type: mime, lastModified: file.lastModified });
      staged.set(id, { ...stagedFiles(id), [kind]: snapshot });
      recordRoundTwo({ phase: 'file-read', outcome: 'ok', bytes: bytes.byteLength, mime });
    } catch {
      recordRoundTwo({ phase: 'file-read', outcome: 'unreadable' });
      throw new Error('This file is no longer readable. Save it to Downloads on this device, then select it again.');
    }
  })();
  preparing.set(key, task);
  try { await task; }
  catch (error) {
    if (ticket === generation && preparing.get(key) === task) operation(id, { busy: false, progress: '', error: error instanceof Error ? error.message : 'Choose the file again.' });
    throw error;
  } finally {
    if (preparing.get(key) === task) {
      preparing.delete(key);
      if (ticket === generation) operation(id, { ...roundTwoOperation(id), progress: '' });
    }
  }
}
interface RosterPerson { entry_id: string; name: string; college: string; email: string; team_index: number }
let roster: RosterPerson[] = [];
export function rosterFor(id: string): RosterPerson[] { return roster.filter(p=>p.entry_id===id); }
let loadError = '';
let generation = 0;
export function clearRoundTwo(): void { generation++; entries = []; roster = []; loadError = ''; staged.clear(); uploaded.clear(); preparing.clear(); operations.clear(); reviewDrafts.clear(); clearExtraAbstracts(); clearUploadRecovery(); clearRoundTwoDiagnostics(); }
export function roundTwoError(): string { return loadError; }
export function allRoundTwo(): RoundTwoEntry[] { return entries; }
export function myRoundTwo(): RoundTwoEntry[] {
  return entries.filter(e => e.user_id === getCurrentUser()?.id);
}
export function latestAttempt(e: RoundTwoEntry): RoundTwoAttempt | undefined {
  return [...e.round_two_attempts].sort((a,b) => b.attempt_number - a.attempt_number)[0];
}
export async function loadRoundTwo(): Promise<void> {
  const ticket = generation;
  const uid = getCurrentUser()?.id;
  if (!supabase || !uid) { clearRoundTwo(); return; }
  const [{data,error},people] = await Promise.all([
    supabase.from('round_two_entries').select('*, round_two_attempts(*)').order('created_at',{ascending:false}),
    supabase.rpc('round_two_roster')
  ]);
  if (ticket !== generation || uid !== getCurrentUser()?.id) return;
  loadError = error || people.error ? 'Round 2 could not be loaded. Please refresh and try again.' : '';
  entries = error ? [] : data as RoundTwoEntry[];
  roster = people.error ? [] : people.data as RosterPerson[];
  await loadExtraAbstracts();
}
export async function startRoundTwo(eventId: string, registrationId?: string, intent?: EventRegistrationIntent): Promise<string> {
  if (!supabase || !getCurrentUser()) throw new Error('Sign in to continue Round 2.');
  const {data,error} = await supabase.rpc('start_round_two',{
    p_event_id:eventId, p_registration_id:registrationId ?? null,
    p_team:intent ? toServerTeams(intent)[0] : null
  }).retry(false);
  if (error) throw new Error(error.message);
  await loadRoundTwo();
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.id) throw new Error('Unable to load the Round 2 entry. Refresh My Events.');
  return result.id;
}
export const ABSTRACT_TYPES = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'];
const PROOF_TYPES = ['image/jpeg','image/png','application/pdf'];
export function roundTwoMime(file: File): string {
  const type = file.type.toLowerCase();
  if (type && type !== 'application/octet-stream') return type === 'image/jpg' ? 'image/jpeg' : type;
  // Some Android document providers return an empty/generic MIME. Restrict
  // inference to the same server allowlist; never override an explicit type.
  const extensions: Record<string, string> = { pdf: ABSTRACT_TYPES[0], doc: ABSTRACT_TYPES[1], docx: ABSTRACT_TYPES[2], ppt: ABSTRACT_TYPES[3], pptx: ABSTRACT_TYPES[4], jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
  return extensions[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? type;
}
export function validateRoundTwoFile(file: File, kind: 'abstract' | 'payment'): void {
  const limit = kind === 'abstract' ? 10 : 5;
  if (!(kind === 'abstract' ? ABSTRACT_TYPES : PROOF_TYPES).includes(roundTwoMime(file))) throw new Error(kind === 'abstract' ? 'Choose a PDF, Word or PowerPoint file.' : 'Choose a JPEG, PNG or PDF payment proof.');
  if (file.size < 1 || file.size > limit*1024*1024) throw new Error(`Choose a file between 1 byte and ${limit} MB.`);
}
async function upload(entry: RoundTwoEntry, file: File | undefined, kind: FileKind): Promise<UploadRecord> {
  if (file) validateRoundTwoFile(file, kind);
  if (!supabase || entry.user_id !== getCurrentUser()?.id) throw new Error('Sign in to upload.');
  const ticket = generation;
  const guard = () => { if (generation !== ticket || entry.user_id !== getCurrentUser()?.id) throw new Error('Session changed. Sign in again before uploading.'); };
  const previous = recoverableFile(entry.id, kind);
  if (!file && !previous) throw new Error(`Attach your Round 2 ${kind === 'payment' ? 'payment proof' : 'abstract'}.`);
  const extension = file?.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'file';
  const folder = `${entry.user_id}/${entry.id}`;
  const record: UploadRecord = previous ?? { path: `${folder}/${crypto.randomUUID()}.${extension}`, name: file!.name.slice(0,240), size: file!.size, mime: roundTwoMime(file!), at: Date.now(), confirmed: false };
  const path = record.path;
  const fileName = path.split('/').pop()!;
  const bucket = kind === 'abstract' ? 'round-two-abstracts' : 'round-two-payments';
  const storage = supabase.storage.from(bucket);
  const remember = (): UploadRecord => {
    guard(); record.confirmed = true;
    uploaded.set(entry.id, { ...uploaded.get(entry.id), [kind]: record });
    writeUpload(entry.user_id, entry.id, kind, record);
    return record;
  };

  // A mobile connection can drop *after* the server has stored the file.
  // Check the unique object path before retrying; never overwrite evidence.
  const alreadyStored = async (): Promise<boolean> => {
    try {
      const { data, error } = await storage.list(folder, { search: fileName, limit: 20 });
      guard();
      return !error && Boolean(data?.some(item => item.name === fileName && Number(item.metadata?.size) === record.size && item.metadata?.mimetype === record.mime));
    } catch {
      return false;
    }
  };

  if (previous && await alreadyStored()) return remember();
  guard();
  if (!file) throw new Error(`The saved ${kind} upload could not be verified. Reconnect and retry, or select that file again. Do not pay again.`);
  let bytes: ArrayBuffer;
  try { bytes = await readFileBytes(file); }
  catch { throw new Error('This file cannot be read. Save it to Downloads and select it again.'); }
  guard();
  // Journal the chosen immutable path BEFORE sending. A reload/lost response
  // must resume this path, not create another piece of payment evidence.
  uploaded.set(entry.id, { ...uploaded.get(entry.id), [kind]: record });
  writeUpload(entry.user_id, entry.id, kind, record);
  for (let attempt = 0; attempt < 2; attempt++) {
    guard();
    try {
      if (attempt === 1) {
        // Alternate signed-upload route if ordinary multipart uploads cannot
        // reach Storage. The token is scoped to this new object path.
        const signed = await storage.createSignedUploadUrl(path);
        if (signed.error) throw signed.error;
        guard();
        const result = await storage.uploadToSignedUrl(path, signed.data.token, bytes, {
          contentType: record.mime, upsert: false
        });
        if (result.error) throw result.error;
      } else {
        const { error } = await storage.upload(path, bytes, { contentType: record.mime, upsert: false });
        if (error) throw error;
      }
      return remember();
    } catch (failure) {
      guard();
      const detail = failure instanceof Error ? failure.message : String(failure);
      const networkFailure = /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout|connection|abort/i.test(detail);
      const duplicate = /already exists|duplicate|resource already exists/i.test(detail);
      if ((networkFailure || duplicate) && await alreadyStored()) return remember();
      // Permission, size and MIME errors are not connectivity failures.
      if (!networkFailure && !duplicate) {
        const code = Number((failure as { statusCode?: string }).statusCode);
        throw new Error(code === 401 || code === 403 ? 'Your upload session or permission is no longer valid. Sign in again; do not pay again.' : `The file server rejected the ${kind} upload. Check the file type and size, or copy upload diagnostics for the organisers.`);
      }
      if (duplicate) throw new Error(`File already exists but could not be verified (${kind}). Please retry.`);
      if (attempt === 1) {
        throw new Error(`The ${kind} upload could not be confirmed. Your selection is kept in this tab. Retry to check the same upload, or copy upload diagnostics for the organisers. Do not pay again.`);
      }
    }
  }
  throw new Error(`Unable to upload the ${kind} file. Please retry.`);
}
export async function submitRoundTwo(
  entry: RoundTwoEntry, abstract?: File, proof?: File,
  onProgress?: (stage: 'abstract' | 'payment' | 'saving') => void
): Promise<void> {
  if (!supabase) throw new Error('Round 2 is unavailable.');
  if (roundTwoOperation(entry.id).busy) throw new Error('This submission is already in progress.');
  const uid = getCurrentUser()?.id;
  const ticket = generation;
  const guard = () => { if (!uid || uid !== entry.user_id || uid !== getCurrentUser()?.id || ticket !== generation) throw new Error('Session changed. Sign in again.'); };
  guard();
  operation(entry.id, { busy: true, progress: 'Checking submission…', error: '' });
  const progress = (stage: 'abstract' | 'payment' | 'saving') => {
    guard(); operation(entry.id, { busy: true, progress: { abstract: 'Uploading abstract…', payment: 'Uploading payment proof…', saving: 'Saving for review…' }[stage], error: '' }); onProgress?.(stage);
  };
  try {
    await Promise.all([...preparing].filter(([key]) => key.startsWith(entry.id + ':')).map(([,task]) => task));
    guard();
    const session = await withDeadline(supabase.auth.getSession(),15000,'Your sign-in session could not be checked. Retry or sign in again; do not pay again.');
    guard();
    if (session.error || session.data.session?.user.id !== uid) throw new Error('Sign in again to upload. Your payment must not be repeated.');
    // Reconcile first: a previous RPC may have committed despite a lost reply,
    // or another tab may have submitted/reviewed the same entry.
    await loadRoundTwo(); guard();
    if (loadError) throw new Error('Unable to check the current submission. Reconnect and retry; do not pay again.');
    const fresh = myRoundTwo().find(e => e.id === entry.id);
    if (!fresh) throw new Error('This entry is no longer available. Refresh My Events.');
    entry = fresh;
    const prior = latestAttempt(entry);
    const savedAbstract = recoverableFile(entry.id,'abstract'), savedProof = recoverableFile(entry.id,'payment');
    // An uncertain attempt may already have been reviewed by the time this
    // tab returns. Reconcile its paths before treating a rejection as a new
    // correction; don't submit the same rejected evidence as another attempt.
    const recoveredAttempt = prior && (savedAbstract || savedProof)
      && prior.abstract_path === (savedAbstract?.path ?? (entry.submission_status==='approved' ? prior.abstract_path : undefined))
      && prior.proof_path === (savedProof?.path ?? (entry.payment_status==='approved' ? prior.proof_path : undefined));
    if (recoveredAttempt || (entry.payment_status !== 'draft' && entry.payment_status !== 'rejected' && entry.submission_status !== 'rejected')) {
      staged.delete(entry.id); uploaded.delete(entry.id); forgetUploads(uid!, entry.id); return;
    }
    // Prefer snapshots made by stageFile; the input File passed by a caller may
    // still refer to a revoked Android provider handle.
    abstract = stagedFiles(entry.id).abstract ?? abstract;
    proof = stagedFiles(entry.id).payment ?? proof;
    if (entry.submission_status !== 'approved' && !abstract && !recoverableFile(entry.id, 'abstract')) throw new Error('Attach your Round 2 abstract.');
    if (entry.payment_status !== 'approved' && !proof && !recoverableFile(entry.id, 'payment')) throw new Error('Attach your Round 2 payment proof.');
    if (abstract && entry.submission_status !== 'approved') validateRoundTwoFile(abstract, 'abstract');
    if (proof && entry.payment_status !== 'approved') validateRoundTwoFile(proof, 'payment');
    let ap: UploadRecord | undefined, pp: UploadRecord | undefined;
    if (entry.submission_status !== 'approved') { progress('abstract'); ap = await upload(entry, abstract, 'abstract'); }
    if (entry.payment_status !== 'approved') { progress('payment'); pp = await upload(entry, proof, 'payment'); }
    guard(); progress('saving');
    const {error} = await supabase.rpc('submit_round_two', { p_entry_id: entry.id, p_abstract_path: ap?.path ?? null, p_abstract_name: ap?.name ?? null, p_proof_path: pp?.path ?? null }).retry(false);
    guard();
    if (error) {
      recordRoundTwo({ phase: 'submit-result', outcome: 'http-or-response-error' });
      await loadRoundTwo(); guard();
      const saved = myRoundTwo().find(e => e.id === entry.id);
      const latest = saved && latestAttempt(saved);
      const before = latestAttempt(entry);
      const matches = latest && latest.abstract_path === (ap?.path ?? before?.abstract_path) && latest.proof_path === (pp?.path ?? before?.proof_path);
      if (loadError || !matches) throw new Error('Submission could not be confirmed. Retry to check the saved files and status. Do not pay again.');
      recordRoundTwo({ phase: 'submit-reconcile', outcome: 'committed' });
    }
    staged.delete(entry.id); uploaded.delete(entry.id); forgetUploads(uid!, entry.id);
    await loadRoundTwo(); guard();
  } catch (error) {
    if (ticket === generation) operation(entry.id, { busy: false, progress: '', error: error instanceof Error ? error.message : 'Unable to submit. Retry without paying again.' });
    throw error;
  } finally {
    if (ticket === generation) operation(entry.id, { ...roundTwoOperation(entry.id), busy: false, progress: '' });
  }
}
export async function removeDraftRoundTwo(entry: RoundTwoEntry): Promise<void> {
  if (!supabase || entry.user_id !== getCurrentUser()?.id) throw new Error('Sign in to remove your draft.');
  if (roundTwoOperation(entry.id).busy || hasRoundTwoFile(entry.id, 'payment')) throw new Error('Payment proof is selected or uploaded. Keep this entry and contact the organisers if you have paid.');
  if (entry.payment_status !== 'draft' || entry.submission_status !== 'draft' || entry.round_two_attempts.length) {
    throw new Error('Submitted entries cannot be removed. Contact the organisers.');
  }
  const {error} = await supabase.rpc('remove_draft_round_two',{p_entry_id:entry.id}).retry(false);
  if (error) throw new Error(error.message);
  staged.delete(entry.id);
  uploaded.delete(entry.id);
  forgetUploads(entry.user_id, entry.id);
  await loadRoundTwo();
}

export async function reviewRoundTwo(id: string, kind: 'payment' | 'submission', approve: boolean, reason: string): Promise<void> {
  if (!supabase) throw new Error('Round 2 is unavailable.');
  const draft = roundTwoReviewDraft(id, kind);
  if (draft.busy) return;
  draft.busy = true; draft.error = '';
  try {
    const {error} = await supabase.rpc('review_round_two',{p_attempt_id:id,p_kind:kind,p_approve:approve,p_reason:reason}).retry(false);
    if (error) throw new Error(error.message);
    draft.reason = ''; await loadRoundTwo();
  } catch (error) { draft.error = error instanceof Error ? error.message : 'Review failed.'; throw error; }
  finally { draft.busy = false; }
}
export async function roundTwoFileUrl(path: string, kind: 'abstract' | 'payment'): Promise<string> {
  if (!supabase) throw new Error('Round 2 is unavailable.');
  const {data,error} = await supabase.storage.from(kind==='abstract'?'round-two-abstracts':'round-two-payments').createSignedUrl(path,60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
