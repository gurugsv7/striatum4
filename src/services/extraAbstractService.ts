import { supabase } from './supabaseClient.ts';
import { getCurrentUser } from './authService.ts';

export interface ExtraAbstract {
  id: string; entry_id: string; user_id: string; abstract_path: string; abstract_name: string;
  status: 'under_review'|'approved'|'rejected'; review_reason: string|null;
  submitted_at: string; reviewed_at: string|null;
}
let extras: ExtraAbstract[] = [];
let loadError = '';
const selected = new Map<string, File>();
const busy = new Set<string>();
const errors = new Map<string,string>();
const reviews = new Map<string,string>();
export const extraAbstractsFor = (entryId:string) => extras.filter(x=>x.entry_id===entryId).sort((a,b)=>a.submitted_at.localeCompare(b.submitted_at));
export const extraAbstractBusy = (id:string) => busy.has(id);
export const extraAbstractError = (id:string) => errors.get(id) ?? '';
export const extraAbstractFile = (id:string) => selected.get(id);
export const extraAbstractLoadError = () => loadError;
export const extraReviewReason = (id:string) => reviews.get(id) ?? '';
export const setExtraReviewReason = (id:string,value:string) => reviews.set(id,value);
export function clearExtraAbstracts():void { extras=[];loadError='';selected.clear();busy.clear();errors.clear();reviews.clear(); }
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
  errors.delete(entryId); selected.delete(entryId);
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
export async function submitExtraAbstract(entryId:string,userId:string):Promise<void>{
  if(!supabase || getCurrentUser()?.id!==userId)throw new Error('Sign in to submit an abstract.');
  if(busy.has(entryId))return;
  const file=selected.get(entryId);
  if(!file)throw new Error('Choose an additional abstract.');
  busy.add(entryId);errors.delete(entryId);
  const path=`${userId}/${entryId}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'pdf'}`;
  try{
    const storage=supabase.storage.from('round-two-abstracts');
    const bytes=await file.arrayBuffer();
    let {error}=await storage.upload(path,bytes,{contentType:file.type,upsert:false});
    if(error){
      const detail=error.message;
      if(!/failed to fetch|network|load failed|abort|timeout/i.test(detail))throw error;
      // The first response may have been lost; check before using signed upload.
      const check=await storage.list(`${userId}/${entryId}`,{search:path.split('/').pop()!,limit:20});
      if(!check.data?.some(f=>f.name===path.split('/').pop())){
        const signed=await storage.createSignedUploadUrl(path);
        if(signed.error)throw signed.error;
        const retry=await storage.uploadToSignedUrl(path,signed.data.token,bytes,{contentType:file.type,upsert:false});
        if(retry.error)throw retry.error;
      }
    }
    // The RPC is idempotent on this path; never create duplicate submissions.
    const result=await supabase.rpc('submit_extra_round_two_abstract',{
      p_entry_id:entryId,p_abstract_path:path,p_abstract_name:file.name
    }).retry(false);
    if(result.error)throw result.error;
    selected.delete(entryId);
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
