import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test, after } from 'node:test';

// Real PostgreSQL in WASM; only Supabase-owned auth/storage scaffolding is
// simulated. All repository SQL, RLS, RPCs and business constraints run in PG.
const db = new PGlite();
after(()=>db.close());
const owner='10000000-0000-4000-8000-000000000001';
const stranger='10000000-0000-4000-8000-000000000002';
const finance='10000000-0000-4000-8000-000000000003';
const organiser='10000000-0000-4000-8000-000000000004';
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create schema storage;
  create table auth.users(id uuid primary key,email text,encrypted_password text,raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create function auth.role() returns text language sql stable as $$select current_user::text$$;
  create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,metadata jsonb,owner uuid,unique(bucket_id,name));
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
  grant usage on schema public,auth,storage to anon,authenticated;
  grant execute on all functions in schema auth,storage to anon,authenticated;
  grant select,insert,update,delete on storage.objects to authenticated;
  alter default privileges in schema public grant all on tables to authenticated;
  insert into auth.users(id,email,encrypted_password) values
    ('${owner}','owner@example.test','synthetic'),('${stranger}','stranger@example.test','synthetic'),
    ('${finance}','financesigma26@gmail.com','synthetic'),('${organiser}','gurugsv235@gmail.com','synthetic');
`);
const migrations=(await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort();
const migration=migrations.find(n=>n.endsWith('_round_two_entries.sql'));
for(const name of migrations.filter(n=>n!==migration)) {
  let sql=await readFile('supabase/migrations/'+name,'utf8');
  sql=sql.replace('create extension if not exists "pgcrypto";',''); // UUIDs are built into PG.
  try { await db.exec(sql); }
  catch(error) { throw new Error(`Baseline migration ${name}: ${error.message}`); }
  if(name.endsWith('_striatum_core.sql')) {
    // This function existed out-of-band before the repo's lockdown migration.
    await db.exec(await readFile('supabase/migrations/20260914160200_reject_delegate_missing_from_repo.sql','utf8'));
    await db.exec(await readFile('supabase/seed/events_seed.sql','utf8'));
    await db.exec(`insert into public.admins(user_id) values('${finance}'),('${organiser}')`);
  }
}
await db.exec(await readFile('supabase/migrations/'+migration,'utf8'));
await db.exec('grant select on storage.buckets to authenticated;');
async function as(uid,fn,role='authenticated') {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid ?? '']);
  await db.exec(`set role ${role}`);
  try { return await fn(); } finally { await db.exec('reset role'); }
}
async function rpc(name,args) {
  const {rows}=await db.query(`select * from public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')})`,args);
  return rows[0];
}
const team=(n=1)=>({team_index:1,participants:Array.from({length:n},(_,i)=>({position:i+1,role:i===0?'captain':'member',name:`Synthetic ${i+1}`,year_of_study:'2024',college:'Test College',phone:'9999999999',email:'synthetic@example.test'}))});
async function start(event,n=1) { return as(owner,()=>rpc('start_round_two',[event,null,team(n)])); }
async function entry(id) { return (await db.query('select * from round_two_entries where id=$1',[id])).rows[0]; }
async function latest(id) { return (await db.query('select * from round_two_attempts where entry_id=$1 order by attempt_number desc limit 1',[id])).rows[0]; }
async function file(e,kind,options={}) {
  const path=`${e.user_id}/${e.id}/${crypto.randomUUID()}.pdf`;
  await as(e.user_id,()=>db.query('insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3)',[kind==='abstract'?'round-two-abstracts':'round-two-payments',path,{size:1024,mimetype:'application/pdf',...options}]));
  return path;
}
async function submit(e) { const ap=await file(e,'abstract'); const pp=await file(e,'payment'); await as(owner,()=>rpc('submit_round_two',[e.id,ap,'Synthetic abstract.pdf',pp])); return latest(e.id); }
let coral;

test('all six fees, roster validation, original registration anchors and duplicate starts',async()=>{
  for(const [event,n,fee] of [['s4-14',2,400],['s4-15',1,400],['s4-16',1,300],['s4-17',2,400],['s4-18',3,500],['s4-19',1,300]]) {
    const e=await start(event,n); if(event==='s4-16') coral=e;
    assert.equal(e.fee,fee); assert.equal(e.payment_status,'draft');
    const r=(await db.query('select * from registrations where id=$1',[e.registration_id])).rows[0];
    assert.equal(r.user_id,owner); assert.equal(r.event_id,event);
    assert.equal((await as(owner,()=>rpc('start_round_two',[event,r.id,null]))).id,e.id);
    await assert.rejects(()=>start(event,n),/Already registered/);
  }
  await as(stranger,async()=>{
    await assert.rejects(()=>rpc('start_round_two',['s4-16',null,team(3)]),/between|Invalid|member/i);
    await assert.rejects(()=>rpc('start_round_two',['s4-18',null,team(4)]),/between|Invalid|member/i);
    await assert.rejects(()=>rpc('start_round_two',['s4-19',null,team(2)]),/between|Invalid|member|participant/i);
    await assert.rejects(()=>rpc('start_round_two',['s4-14',null,team(1)]),/between|Invalid|member/i);
  });
});

test('original multi-entry registrations pay separately, preserving historical money/files',async()=>{
  const oid=crypto.randomUUID(); const lid=crypto.randomUUID(); const rid1=crypto.randomUUID(); const rid2=crypto.randomUUID();
  await db.query(`insert into orders(id,reference,user_id,subtotal,total,pricing_phase,status,proof_path) values($1,'HISTORIC', $2,700,700,'early','approved','historical-payment.png')`,[oid,stranger]);
  await db.query(`insert into order_lines(id,order_id,event_id,event_name,event_code,context,category,participation,quantity,unit_price,abstract_path,abstract_name) values($1,$2,'s4-16','CORAL CANVAS','S4 / 16','Historic','presentation','team',2,350,'historical-abstract.pdf','Original.pdf')`,[lid,oid]);
  await db.query(`insert into registrations(id,order_id,user_id,event_id,participation,team_index) values($1,$3,$4,'s4-16','team',1),($2,$3,$4,'s4-16','team',2)`,[rid1,rid2,oid,stranger]);
  const before=JSON.stringify((await db.query('select row_to_json(o) as o,(select row_to_json(l) from order_lines l where id=$2) as l from orders o where id=$1',[oid,lid])).rows);
  const a=await as(stranger,()=>rpc('start_round_two',['s4-16',rid1,null]));
  const b=await as(stranger,()=>rpc('start_round_two',['s4-16',rid2,null]));
  assert.equal(a.fee,400); assert.equal(b.fee,400); assert.notEqual(a.id,b.id);
  assert.equal(JSON.stringify((await db.query('select row_to_json(o) as o,(select row_to_json(l) from order_lines l where id=$2) as l from orders o where id=$1',[oid,lid])).rows),before);
});

test('ownership, anonymous access, direct writes and retired cart route are denied',async()=>{
  await as(stranger,async()=>{
    assert.equal((await db.query('select * from round_two_entries where id=$1',[coral.id])).rows.length,0);
    await assert.rejects(()=>rpc('start_round_two',['s4-16',coral.registration_id,null]),/not found/i);
    await assert.rejects(()=>rpc('submit_round_two',[coral.id,'fake','fake','fake']),/not found/i);
    await assert.rejects(()=>db.query("update round_two_entries set fee=1 where id=$1",[coral.id]),/permission denied/i);
    await assert.rejects(()=>rpc('create_order',[[{event_id:'s4-16'}]]),/Round 2 registration is open/);
    await assert.rejects(()=>rpc('create_round_one_order',[[]]),/permission denied/i);
  });
  await as(null,async()=>{
    await assert.rejects(()=>db.query('select * from round_two_entries'),/permission denied/i);
    await assert.rejects(()=>rpc('start_round_two',['s4-16',null,team()]),/permission denied/i);
  },'anon');
});

test('uploads must exist with valid metadata, correct entry paths, and remain immutable',async()=>{
  await as(owner,()=>assert.rejects(()=>rpc('submit_round_two',[coral.id,`${owner}/${coral.id}/abs.pdf`,'Abs.pdf',`${owner}/${coral.id}/pay.pdf`]),/Upload valid/));
  const bad=await file(coral,'abstract',{size:10485761}); const pp=await file(coral,'payment');
  await as(owner,()=>assert.rejects(()=>rpc('submit_round_two',[coral.id,bad,'Bad.pdf',pp]),/Upload valid/));
  const ap=await file(coral,'abstract');
  await as(stranger,()=>assert.rejects(()=>db.query('insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3)',['round-two-abstracts',`${owner}/${coral.id}/forged.pdf`,{size:1,mimetype:'application/pdf'}]),/row-level security/i));
  const other=(await db.query("select * from round_two_entries where user_id=$1 and event_id='s4-15'",[owner])).rows[0];
  await as(owner,()=>assert.rejects(()=>rpc('submit_round_two',[other.id,ap,'Abs.pdf',pp]),/Invalid file path/));
  await as(owner,()=>rpc('submit_round_two',[coral.id,ap,'Good.pdf',pp]));
  const attempt=await latest(coral.id);
  await as(owner,async()=>{
    assert.equal((await db.query("update storage.objects set metadata='{}' where name=$1 returning id",[ap])).rows.length,0);
    assert.equal((await db.query('delete from storage.objects where name=$1 returning id',[ap])).rows.length,0);
    await assert.rejects(()=>file(coral,'abstract'),/row-level security/i);
    await assert.rejects(()=>rpc('review_round_two',[attempt.id,'payment',true,null]),/Not authorised/);
    await assert.rejects(()=>rpc('submit_round_two',[coral.id,ap,'Abs.pdf',pp]),/already submitted/);
  });
  await as(organiser,async()=>{
    assert.equal((await db.query('select * from storage.objects where name=$1',[pp])).rows.length,0);
    assert.equal((await db.query('select * from storage.objects where name=$1',[ap])).rows.length,1);
    await assert.rejects(()=>rpc('review_round_two',[attempt.id,'payment',true,null]),/Not authorised/);
  });
  await as(finance,async()=>{
    assert.equal((await db.query('select * from storage.objects where name=$1',[pp])).rows.length,1);
    await assert.rejects(()=>rpc('review_round_two',[attempt.id,'payment',false,'  ']),/reason is required/);
    await rpc('review_round_two',[attempt.id,'payment',true,null]);
  });
});

test('abstract correction retains approved payment, full history, and rejects stale reviews',async()=>{
  const first=await latest(coral.id);
  await as(organiser,()=>rpc('review_round_two',[first.id,'submission',false,'Please include methods.']));
  const ap=await file(coral,'abstract');
  await as(owner,()=>rpc('submit_round_two',[coral.id,ap,'Corrected.pdf',null]));
  const second=await latest(coral.id);
  assert.equal(second.payment_status,'approved'); assert.equal(second.proof_path,first.proof_path);
  assert.equal((await db.query('select count(*)::int as n from round_two_attempts where entry_id=$1',[coral.id])).rows[0].n,2);
  await as(organiser,async()=>{
    await assert.rejects(()=>rpc('review_round_two',[first.id,'submission',true,null]),/stale/);
    await rpc('review_round_two',[second.id,'submission',true,null]);
    await assert.rejects(()=>rpc('review_round_two',[second.id,'submission',false,'Changed my mind']),/already reviewed/);
  });
  assert.equal((await entry(coral.id)).payment_status,'approved');
  assert.equal((await entry(coral.id)).submission_status,'approved');
});

test('payment correction retains approved abstract and new fees ignore old payments',async()=>{
  const e=(await db.query("select * from round_two_entries where user_id=$1 and event_id='s4-17'",[owner])).rows[0];
  const a=await submit(e);
  await as(organiser,()=>rpc('review_round_two',[a.id,'submission',true,null]));
  await as(finance,()=>rpc('review_round_two',[a.id,'payment',false,'Amount does not match.']));
  const pp=await file(e,'payment');
  await as(owner,()=>rpc('submit_round_two',[e.id,null,null,pp]));
  const b=await latest(e.id);
  assert.equal(b.submission_status,'approved'); assert.equal(b.abstract_path,a.abstract_path);
  assert.equal(b.payment_status,'under_review'); assert.equal((await entry(e.id)).fee,400);
  await as(finance,()=>rpc('review_round_two',[b.id,'payment',true,null]));
});

test('alternate roster fees, closed events, capacity and unmodified event checkout',async()=>{
  const alternate='10000000-0000-4000-8000-000000000005';
  await db.query("insert into auth.users(id,email) values($1,'alternate@example.test')",[alternate]);
  for (const [event,n,fee] of [['s4-15',2,400],['s4-16',2,400],['s4-17',1,300],['s4-18',1,500]]) {
    const e=await as(alternate,()=>rpc('start_round_two',[event,null,team(n)]));
    assert.equal(e.fee,fee);
  }
  await db.exec("update events set status='closed' where id='s4-14'");
  await as(alternate,()=>assert.rejects(()=>rpc('start_round_two',['s4-14',null,team(2)]),/closed/));
  await db.exec("update events set status='open',slots=1 where id='s4-14'");
  await as(alternate,()=>assert.rejects(()=>rpc('start_round_two',['s4-14',null,team(2)]),/No places/));
  // An existing registration is not blocked from paying by a now-full event.
  const existing=(await db.query("select * from round_two_entries where user_id=$1 and event_id='s4-14'",[owner])).rows[0];
  assert.equal((await as(owner,()=>rpc('start_round_two',['s4-14',existing.registration_id,null]))).id,existing.id);
  const unchanged=await as(alternate,()=>rpc('create_order',[[{event_id:'s4-25',teams:[team(3)]}]]));
  assert(unchanged.total>0); assert.equal(unchanged.pricing_phase,'early');
});
