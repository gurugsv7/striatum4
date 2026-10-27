import { supabase } from './supabaseClient.ts';
import { getCurrentUser } from './authService.ts';

export interface ExtraAbstract {
  id: string; entry_id: string; user_id: string; abstract_path: string; abstract_name: string;
  status: 'under_review'|'approved'|'rejected'; review_reason: string|null;
  fee: number; payment_path: string; payment_status: 'under_review'|'approved'|'rejected'; payment_reason: string|null;
  submitted_at: string; reviewed_at: string|null;
}
let extras: ExtraAbstract[] = [];
let loadError = '';
const selected = new Map<string, File>();
const selectedProofs = new Map<string, File>();
const pendingProofPaths = new Map<string,string>();
// Reuse the same immutable object path across retries in this tab.
const pendingPaths = new Map<string,string>();
const busy = new Set<string>();
const errors = new Map<string,string>();
const reviews = new Map<string,string>();
export const extraAbstractsFor = (entryId:string) => extras.filter(x=>x.entry_id===entryId).sort((a,b)=>a.submitted_at.localeCompare(b.submitted_at));
export const extraAbstractBusy = (id:string) => busy.has(id);
export const extraAbstractError = (id:string) => errors.get(id) ?? '';
export const extraAbstractFile = (id:string) => selected.get(id);
export const extraPaymentFile = (id:string) => selectedProofs.get(id);
export const extraAbstractLoadError = () => loadError;
export const extraReviewReason = (id:string) => reviews.get(id) ?? '';
export const setExtraReviewReason = (id:string,value:string) => reviews.set(id,value);
export function clearExtraAbstracts():void { extras=[];loadError='';selected.clear();selectedProofs.clear();pendingPaths.clear();pendingProofPaths.clear();busy.clear();errors.clear();reviews.clear(); }
export async function loadExtraAbstracts():Promise<void> {
  if(!supabase || !getCurrentUser()) { clearExtraAbstracts();return; }
  const uid=getCurrentUser()!.id;
  const {data,error}=await supabase.from('round_two_extra_abstracts').select('*').order('submitted_at',{ascending:false});
  if(uid!==getCurrentUser()?.id)return;
  if(error){loadError='Additional abstracts could not be loaded. Refresh to retry.';return;}
  loadError=''; extras=data as ExtraAbstract[];
}
const mimeTypes:Record<string,string>={
 pdf:'application/pdf',doc:'application/msword',
 docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 ppt:'application/vnd.ms-powerpoint',
 pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};
function fileMime(file:File):string {
  if(file.type && file.type!=='application/octet-stream')return file.type;
  return mimeTypes[file.name.split('.').pop()?.toLowerCase()??'']??file.type;
}
export async function selectExtraAbstract(entryId:string,file?:File):Promise<void>{
  errors.delete(entryId); selected.delete(entryId); pendingPaths.delete(entryId);
  if(!file)return;
  const mime=fileMime(file);
  if(!Object.values(mimeTypes).includes(mime))throw new Error('Choose a PDF, Word or PowerPoint file.');
  if(!file.size || file.size>10485760)throw new Error('The abstract must be 10 MB or smaller.');
  try {
    // Snapshot the file immediately: Android document providers can revoke access.
    const bytes=await file.arrayBuffer();
    if(bytes.byteLength!==file.size)throw new Error('Incomplete file');
    selected.set(entryId,new File([bytes],file.name,{type:mime,lastModified:file.lastModified}));
  } catch {throw new Error('Unable to read this file. Save it to Downloads and select it again.');}
}
export async function selectExtraPayment(entryId:string,file?:File):Promise<void>{
  errors.delete(entryId); selectedProofs.delete(entryId); pendingProofPaths.delete(entryId);
  if(!file)return;
  const ext=file.name.split('.').pop()?.toLowerCase()??'';
  const type=file.type && file.type!=='application/octet-stream' ? file.type : ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',pdf:'application/pdf'} as Record<string,string>)[ext];
  if(!['image/jpeg','image/png','application/pdf'].includes(type))throw new Error('Choose a JPEG, PNG or PDF payment proof.');
  if(!file.size||file.size>5242880)throw new Error('Payment proof must be 5 MB or smaller.');
  try {
    const bytes=await file.arrayBuffer();
    if(bytes.byteLength!==file.size)throw new Error('Incomplete proof');
    selectedProofs.set(entryId,new File([bytes],file.name,{type,lastModified:file.lastModified}));
  } catch {throw new Error('Cannot read the payment proof. Save it to Downloads and choose again.');}
}
async function putFile(bucket:'round-two-payments'|'round-two-abstracts',path:string,file:File):Promise<void>{
  if(!supabase)throw new Error('Storage unavailable.');
  const storage=supabase.storage.from(bucket);
  const folder=path.split('/').slice(0,2).join('/'),name=path.split('/').pop()!;
  const exists=async()=> {
    const check=await storage.list(folder,{search:name,limit:20});
    return !check.error && Boolean(check.data?.some(x=>x.name===name&&Number(x.metadata?.size)===file.size));
  };
  if(await exists())return;
  const bytes=await file.arrayBuffer();
  const uploaded=await storage.upload(path,bytes,{contentType:file.type,upsert:false});
  if(!uploaded.error)return;
  if(!/failed to fetch|network|load failed|abort|timeout|already exists|duplicate/i.test(uploaded.error.message))throw uploaded.error;
  if(await exists())return;
  const signed=await storage.createSignedUploadUrl(path);
  if(signed.error)throw signed.error;
  const alternate=await storage.uploadToSignedUrl(path,signed.data.token,bytes,{contentType:file.type,upsert:false});
  if(alternate.error && !(await exists()))throw alternate.error;
}
export async function submitExtraAbstract(entryId:string,userId:string):Promise<void>{
  if(!supabase || getCurrentUser()?.id!==userId)throw new Error('Sign in to submit an abstract.');
  if(busy.has(entryId))return;
  const file=selected.get(entryId);
  if(!file)throw new Error('Choose an additional abstract.');
  const proof=selectedProofs.get(entryId);
  if(!proof)throw new Error('Attach a new payment proof for this abstract.');
  busy.add(entryId);errors.delete(entryId);
  const path=pendingPaths.get(entryId) ?? `${userId}/${entryId}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'pdf'}`;
  pendingPaths.set(entryId,path);
  const proofPath=pendingProofPaths.get(entryId) ?? `${userId}/${entryId}/${crypto.randomUUID()}.${proof.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'jpg'}`;
  pendingProofPaths.set(entryId,proofPath);
  try{
    await putFile('round-two-abstracts',path,file);
    await putFile('round-two-payments',proofPath,proof);
    // The RPC is idempotent on this path; never create duplicate submissions.
    const result=await supabase.rpc('submit_extra_round_two_abstract',{
      p_entry_id:entryId,p_abstract_path:path,p_abstract_name:file.name,p_payment_path:proofPath
    }).retry(false);
    if(result.error){
      // The server may have committed even when the browser lost the reply.
      await loadExtraAbstracts();
      if(!extraAbstractsFor(entryId).some(a=>a.abstract_path===path))throw result.error;
    }
    selected.delete(entryId); selectedProofs.delete(entryId); pendingPaths.delete(entryId); pendingProofPaths.delete(entryId);
    await loadExtraAbstracts();
  }catch(e){const message=e instanceof Error?e.message:'Additional abstract upload failed. Please retry.';
    errors.set(entryId,message);throw new Error(message);
  }finally{busy.delete(entryId);}
}
export async function reviewExtraAbstract(id:string,approve:boolean,reason:string):Promise<void>{
  if(!supabase)throw new Error('Sign in to review.');
  if(busy.has(id))return;
  busy.add(id);errors.delete(id);
  try{
    const {error}=await supabase.rpc('review_extra_round_two_abstract',{
      p_abstract_id:id,p_approve:approve,p_reason:reason
    }).retry(false);
    if(error)throw error;
    reviews.delete(id);
    await loadExtraAbstracts();
  }catch(e){const message=e instanceof Error?e.message:'Review failed';errors.set(id,message);throw new Error(message);}
  finally{busy.delete(id);}
}

export async function reviewExtraPayment(id:string,approve:boolean,reason:string):Promise<void>{
 if(!supabase)throw new Error('Sign in to review payment.');
 if(busy.has(id))return;
 busy.add(id);errors.delete(id);
 try {
  const {error}=await supabase.rpc('review_extra_round_two_payment',{
   p_abstract_id:id,p_approve:approve,p_reason:reason
  }).retry(false);
  if(error)throw error;
  reviews.delete(id+':payment');
  await loadExtraAbstracts();
 }catch(e){const message=e instanceof Error?e.message:'Payment review failed';errors.set(id,message);throw new Error(message);}
 finally{busy.delete(id);}
}
