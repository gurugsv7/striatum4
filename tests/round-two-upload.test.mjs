import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
const uid='10000000-0000-4000-8000-000000000001',id='40000000-0000-4000-8000-000000000001';
const saved=new Map();
globalThis.sessionStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k),key:i=>[...saved.keys()][i]??null,get length(){return saved.size;}};
globalThis.__r2fixture={user:{id:uid}};
const result=await build({entryPoints:['src/services/roundTwoService.ts'],bundle:true,format:'esm',platform:'node',write:false,plugins:[{name:'isolated-auth',setup(build){
  build.onResolve({filter:/\/(authService|supabaseClient|registrationForm)\.ts$/},args=>({path:args.path,namespace:'fixture'}));
  build.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path.includes('authService')?'export const getCurrentUser=()=>globalThis.__r2fixture.user;':args.path.includes('supabaseClient')?'export const supabase=null;':'export const toServerTeams=x=>x;'}));
}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const bundle=await build({entryPoints:['src/services/roundTwoRecovery.ts'],bundle:true,format:'esm',platform:'node',write:false});
const recovery=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));

test('selection snapshots bytes immediately and preserves them independently of provider lifetime',async()=>{
  let readable=true,reads=0;
  const file=new File(['%PDF synthetic'],'cloud.pdf',{type:'application/pdf'});
  file.arrayBuffer=async()=>{reads++;if(!readable)throw new DOMException('Provider revoked','NotReadableError');return new TextEncoder().encode('%PDF synthetic').buffer;};
  await api.stageFile(id,'abstract',file);readable=false;
  const snapshot=api.stagedFiles(id).abstract;
  assert.notEqual(snapshot,file);assert.equal(reads,1);assert.equal(await snapshot.text(),'%PDF synthetic');
});
test('unreadable provider files fail at selection with a specific recovery action',async()=>{
  const file=new File(['bad'],'cloud.pdf',{type:'application/pdf'});
  file.arrayBuffer=async()=>{throw new DOMException('revoked','NotReadableError');};
  await assert.rejects(()=>api.stageFile(id,'abstract',file),/Downloads.*select it again/i);
  assert.equal(api.stagedFiles(id).abstract,undefined);assert.match(api.roundTwoOperation(id).error,/no longer readable/);
});
test('Android empty/generic MIME is inferred only for supported extensions; explicit disallowed MIME stays blocked',()=>{
  for(const type of ['', 'application/octet-stream']) assert.doesNotThrow(()=>api.validateRoundTwoFile(new File(['%PDF'],'abstract.PDF',{type}),'abstract'));
  assert.throws(()=>api.validateRoundTwoFile(new File(['script'],'fake.pdf',{type:'text/html'}),'abstract'),/Choose a PDF/);
  assert.throws(()=>api.validateRoundTwoFile(new File(['x'],'unknown.exe'),'payment'),/JPEG/);
  assert.throws(()=>api.validateRoundTwoFile(new File([],'empty.pdf',{type:'application/pdf'}),'abstract'),/between/);
  assert.throws(()=>api.validateRoundTwoFile(new File([new Uint8Array(5242881)],'large.png',{type:'image/png'}),'payment'),/5 MB/);
});
test('a stalled document provider releases the form with a reselect action',async()=>{
  const file=new File(['abc'],'stalled.pdf',{type:'application/pdf'});file.arrayBuffer=()=>new Promise(()=>{});
  const original=globalThis.setTimeout;
  globalThis.setTimeout=(fn,ms,...args)=>original(fn,ms===30000?1:ms,...args);
  try {await assert.rejects(()=>api.stageFile(id,'abstract',file),/Downloads.*select it again/i);}
  finally {globalThis.setTimeout=original;}
  assert.equal(api.roundTwoOperation(id).busy,false);
});
test('latest picker selection wins when provider reads complete out of order',async()=>{
  let release;
  const slow=new File(['old'],'old.pdf',{type:'application/pdf'});slow.arrayBuffer=()=>new Promise(resolve=>release=resolve);
  const pending=api.stageFile(id,'abstract',slow);
  await api.stageFile(id,'abstract',new File(['new'],'new.pdf',{type:'application/pdf'}));
  release(new TextEncoder().encode('old').buffer);await pending;
  assert.equal(api.stagedFiles(id).abstract.name,'new.pdf');
});
test('sign-out during provider read clears private selections and recovery metadata',async()=>{
  let release;const file=new File(['abc'],'pending.pdf',{type:'application/pdf'});file.arrayBuffer=()=>new Promise(resolve=>release=resolve);
  const pending=api.stageFile(id,'abstract',file);
  api.clearRoundTwo();globalThis.__r2fixture.user=null;release(new TextEncoder().encode('abc').buffer);await pending;
  assert.deepEqual(api.stagedFiles(id),{});assert.equal(saved.size,0);
  globalThis.__r2fixture.user={id:uid};
});
test('reload journal is account scoped, expiry bounded, rejects foreign paths and never stores file bodies',()=>{
  const record={path:`${uid}/${id}/immutable.pdf`,name:'abstract.pdf',size:10,mime:'application/pdf',at:Date.now(),confirmed:true};
  recovery.writeUpload(uid,id,'abstract',record);assert.equal(recovery.readUploads(uid)[id].abstract.path,record.path);
  assert.deepEqual(recovery.readUploads('another-user'),{});
  recovery.writeUpload(uid,id,'abstract',{...record,path:`another-user/${id}/fake.pdf`});assert.deepEqual(recovery.readUploads(uid),{});
  recovery.writeUpload(uid,id,'abstract',{...record,at:Date.now()-86400001});assert.deepEqual(recovery.readUploads(uid),{});
  recovery.clearUploadRecovery();assert.equal(saved.size,0);
});
