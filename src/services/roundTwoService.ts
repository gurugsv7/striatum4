import { supabase } from './supabaseClient.ts';
import { getCurrentUser } from './authService.ts';
import type { EventRegistrationIntent } from './registrationForm.ts';
import { toServerTeams } from './registrationForm.ts';

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
const uploaded = new Map<string, Partial<Record<'abstract' | 'payment', { file: File; path: string }>>>();
export function stagedFiles(id: string): { abstract?: File; payment?: File } { return staged.get(id) ?? {}; }
export function stageFile(id: string, kind: 'abstract' | 'payment', file?: File): void {
  if (stagedFiles(id)[kind] !== file) {
    const saved = uploaded.get(id);
    if (saved) delete saved[kind];
  }
  const files = {...stagedFiles(id), [kind]: file}; staged.set(id, files);
}
interface RosterPerson { entry_id: string; name: string; college: string; email: string; team_index: number }
let roster: RosterPerson[] = [];
export function rosterFor(id: string): RosterPerson[] { return roster.filter(p=>p.entry_id===id); }
let loadError = '';
let generation = 0;
export function clearRoundTwo(): void { generation++; entries = []; roster = []; loadError = ''; staged.clear(); uploaded.clear(); }
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
}
export async function startRoundTwo(eventId: string, registrationId?: string, intent?: EventRegistrationIntent): Promise<string> {
  if (!supabase || !getCurrentUser()) throw new Error('Sign in to continue Round 2.');
  const {data,error} = await supabase.rpc('start_round_two',{
    p_event_id:eventId, p_registration_id:registrationId ?? null,
    p_team:intent ? toServerTeams(intent)[0] : null
  });
  if (error) throw new Error(error.message);
  await loadRoundTwo();
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.id) throw new Error('Unable to load the Round 2 entry. Refresh My Events.');
  return result.id;
}
export const ABSTRACT_TYPES = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'];
const PROOF_TYPES = ['image/jpeg','image/png','application/pdf'];
export function validateRoundTwoFile(file: File, kind: 'abstract' | 'payment'): void {
  const limit = kind === 'abstract' ? 10 : 5;
  if (!(kind === 'abstract' ? ABSTRACT_TYPES : PROOF_TYPES).includes(file.type)) throw new Error(kind === 'abstract' ? 'Choose a PDF, Word or PowerPoint file.' : 'Choose a JPEG, PNG or PDF payment proof.');
  if (file.size < 1 || file.size > limit*1024*1024) throw new Error(`Choose a file between 1 byte and ${limit} MB.`);
}
async function upload(entry: RoundTwoEntry, file: File, kind: 'abstract' | 'payment'): Promise<string> {
  validateRoundTwoFile(file, kind);
  if (!supabase || entry.user_id !== getCurrentUser()?.id) throw new Error('Sign in to upload.');
  const previous = uploaded.get(entry.id)?.[kind];
  if (previous?.file === file) return previous.path;

  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'file';
  const folder = `${entry.user_id}/${entry.id}`;
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const path = `${folder}/${fileName}`;
  const bucket = kind === 'abstract' ? 'round-two-abstracts' : 'round-two-payments';
  const storage = supabase.storage.from(bucket);
  const remember = (): string => {
    uploaded.set(entry.id, { ...uploaded.get(entry.id), [kind]: { file, path } });
    return path;
  };

  // A mobile connection can drop *after* the server has stored the file.
  // Check the unique object path before retrying; never overwrite evidence.
  const alreadyStored = async (): Promise<boolean> => {
    try {
      const { data, error } = await storage.list(folder, { search: fileName, limit: 20 });
      return !error && Boolean(data?.some(item => item.name === fileName));
    } catch {
      return false;
    }
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    if (entry.user_id !== getCurrentUser()?.id) throw new Error('Session changed. Sign in again before uploading.');
    try {
      if (attempt === 2) {
        // Alternate signed-upload route if ordinary multipart uploads cannot
        // reach Storage. The token is scoped to this new object path.
        const signed = await storage.createSignedUploadUrl(path);
        if (signed.error) throw signed.error;
        const result = await storage.uploadToSignedUrl(path, signed.data.token, file, {
          contentType: file.type, upsert: false
        });
        if (result.error) throw result.error;
      } else {
        const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
      }
      return remember();
    } catch (failure) {
      const detail = failure instanceof Error ? failure.message : String(failure);
      const networkFailure = /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout|connection/i.test(detail);
      const duplicate = /already exists|duplicate|resource already exists/i.test(detail);
      if ((networkFailure || duplicate) && await alreadyStored()) return remember();
      // Permission, size and MIME errors are not connectivity failures.
      if (!networkFailure && !duplicate) throw new Error(`File server rejected the ${kind} upload: ${detail}`);
      if (duplicate) throw new Error(`File already exists but could not be verified (${kind}). Please retry.`);
      if (attempt === 2) {
        throw new Error(`Could not complete the ${kind} upload after trying both upload routes. This may be a browser or server connection issue, not necessarily your internet. Your files are still selected. Try another browser or contact the organisers with your Round 2 reference. ${detail}`);
      }
      await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
    }
  }
  throw new Error(`Unable to upload the ${kind} file. Please retry.`);
}
export async function submitRoundTwo(
  entry: RoundTwoEntry, abstract?: File, proof?: File,
  onProgress?: (stage: 'abstract' | 'payment' | 'saving') => void
): Promise<void> {
  if (!supabase) throw new Error('Round 2 is unavailable.');
  // Validate both before uploading either. Approved components are retained by the server.
  if (entry.submission_status !== 'approved' && !abstract) throw new Error('Attach your Round 2 abstract.');
  if (entry.payment_status !== 'approved' && !proof) throw new Error('Attach your Round 2 payment proof.');
  if (abstract) validateRoundTwoFile(abstract,'abstract');
  if (proof) validateRoundTwoFile(proof,'payment');
  if (abstract) onProgress?.('abstract');
  const ap = abstract ? await upload(entry,abstract,'abstract') : null;
  if (proof) onProgress?.('payment');
  const pp = proof ? await upload(entry,proof,'payment') : null;
  onProgress?.('saving');
  const {error} = await supabase.rpc('submit_round_two',{p_entry_id:entry.id,p_abstract_path:ap,p_abstract_name:abstract?.name ?? null,p_proof_path:pp});
  if (error) throw new Error(error.message);
  staged.delete(entry.id);
  uploaded.delete(entry.id);
  await loadRoundTwo();
}
export async function reviewRoundTwo(id: string, kind: 'payment' | 'submission', approve: boolean, reason: string): Promise<void> {
  if (!supabase) throw new Error('Round 2 is unavailable.');
  const {error} = await supabase.rpc('review_round_two',{p_attempt_id:id,p_kind:kind,p_approve:approve,p_reason:reason});
  if (error) throw new Error(error.message);
  await loadRoundTwo();
}
export async function roundTwoFileUrl(path: string, kind: 'abstract' | 'payment'): Promise<string> {
  if (!supabase) throw new Error('Round 2 is unavailable.');
  const {data,error} = await supabase.storage.from(kind==='abstract'?'round-two-abstracts':'round-two-payments').createSignedUrl(path,60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
