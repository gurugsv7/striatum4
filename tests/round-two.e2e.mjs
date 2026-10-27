// Real HTTP bodies + CORS and intentionally lost responses. Synthetic data only.
// npm run test:e2e (after npx playwright install chromium)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const OWNER='10000000-0000-4000-8000-000000000001', FINANCE='10000000-0000-4000-8000-000000000003', ADMIN='10000000-0000-4000-8000-000000000004';
const REG='20000000-0000-4000-8000-000000000001', ORDER='30000000-0000-4000-8000-000000000001', ENTRY='40000000-0000-4000-8000-000000000001';
const NOW='2026-10-26T00:00:00Z';
const artifacts=process.env.R2_ARTIFACTS ?? 'tests/round-two-screenshots';
await mkdir(artifacts,{recursive:true});
let state;
function reset(options={}) {
  state={uid:OWNER,entries:[],objects:new Map(),calls:[],startCalls:[],uploadCalls:[],submitCalls:0,refreshes:0,...options};
}
function anchor() {
  return { orders:[{id:ORDER,user_id:OWNER,reference:'S4 / 0099',subtotal:0,total:0,discount_amount:0,status:'approved',pricing_phase:'early',created_at:NOW,
    order_lines:[{id:'line',event_id:'s4-16',event_name:'CORAL CANVAS',event_code:'S4 / 16',context:'Poster Presentation',category:'presentation',participation:'individual',quantity:1,unit_price:0,abstract_name:'Round 1.pdf',abstract_path:'historical/Round1.pdf'}]}],
    registrations:[{id:REG,user_id:OWNER,order_id:ORDER,event_id:'s4-16',participation:'individual',team_index:1,confirmed_at:NOW}],
    order_line_participants:[{order_id:ORDER,event_id:'s4-16',team_index:1,position:1,role:'captain',name:'Synthetic Participant',college:'Test College',phone:'9999999999',email:'fixture@example.test'}] };
}
function newEntry(event='s4-16') {return {id:ENTRY,registration_id:REG,user_id:OWNER,event_id:event,fee:event==='s4-18'?500:300,payment_status:'draft',submission_status:'draft',created_at:NOW,round_two_attempts:[]};}
function token(uid,expires=3600) {
  return 'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+expires,role:'authenticated'})).toString('base64url')+'.synthetic';
}
function session(uid=OWNER,expires=3600) {return {access_token:token(uid,expires),refresh_token:'synthetic',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+expires,expires_in:expires,user:{id:uid,email:'fixture@example.test',aud:'authenticated',role:'authenticated',user_metadata:{}}};}
const backend=createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:5190');
  res.setHeader('Access-Control-Allow-Headers','*'); res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Expose-Headers','sb-request-id');res.setHeader('sb-request-id','synthetic-request-id');
  if(req.method==='OPTIONS'){res.end();return;}
  let chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks);
  const url=new URL(req.url,'http://127.0.0.1:54445'),path=url.pathname;
  const json=req.headers['content-type']?.includes('application/json') && raw.length ? JSON.parse(raw.toString()) : null;
  state.calls.push(path);let result=[];
  const send=(value,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
  if(path.includes('/auth/v1/token')) {state.refreshes++;send(session(state.uid));return;}
  if(path.includes('/auth/v1/user')) {send(session(state.uid).user);return;}
  if(path.includes('/rest/v1/rpc/')) {
    const name=path.split('/').pop();
    if(name==='is_admin')result=[FINANCE,ADMIN].includes(state.uid);
    else if(name==='is_finance_admin')result=state.uid===FINANCE;
    else if(name==='event_seats_taken')result=1;
    else if(name==='event_seats_available')result=null;
    else if(name==='round_two_roster')result=state.entries.map(e=>({entry_id:e.id,name:'Synthetic Participant',college:'Test College',email:'fixture@example.test',team_index:1}));
    else if(name==='start_round_two') {state.startCalls.push(json);state.created=true;if(!state.entries.length)state.entries=[newEntry(json.p_event_id)];result=state.entries;}
    else if(name==='remove_draft_round_two') {state.entries=[];result=null;}
    else if(name==='submit_round_two') {
      state.submitCalls++; const e=state.entries[0];
      if(state.submitReject){send({message:'Synthetic RPC validation failure'},400);return;}
      if(e.payment_status==='under_review'&&e.submission_status==='under_review'){send({message:'Entry is already submitted'},400);return;}
      const old=e.round_two_attempts.at(-1);
      e.round_two_attempts.push({id:crypto.randomUUID(),entry_id:ENTRY,attempt_number:e.round_two_attempts.length+1,abstract_path:json.p_abstract_path??old?.abstract_path,abstract_name:json.p_abstract_name??old?.abstract_name,proof_path:json.p_proof_path??old?.proof_path,submitted_at:NOW,payment_status:e.payment_status==='approved'?'approved':'under_review',submission_status:e.submission_status==='approved'?'approved':'under_review'});
      if(e.payment_status!=='approved')e.payment_status='under_review';if(e.submission_status!=='approved')e.submission_status='under_review';
      if(state.loseSubmit){state.loseSubmit=false;res.writeHead(200,{'Content-Type':'application/json','Content-Length':'100'});res.write('{');setTimeout(()=>req.socket.destroy(),30);return;}result=null;
    } else if(name==='review_round_two') {
      const e=state.entries[0],a=e.round_two_attempts.at(-1),k=json.p_kind;
      a[k+'_status']=e[k+'_status']=json.p_approve?'approved':'rejected';a[k+'_reason']=json.p_reason;result=null;
    }
  } else if(path.includes('/rest/v1/')) {
    const table=path.split('/').pop();
    result=table==='round_two_entries'?state.entries:table==='events'?[{id:'s4-16',slots:null},{id:'s4-18',slots:null}]:state.newParticipant&&!state.created?[]:anchor()[table]??[];
  } else if(path.includes('/object/list/')) {
    if(state.listFail){send({message:'unavailable'},503);return;}
    const bucket=path.split('/').pop();result=[...state.objects.values()].filter(o=>o.bucket===bucket&&o.path.startsWith(json.prefix+'/')).map(o=>({name:o.path.split('/').pop(),metadata:{size:o.size,mimetype:o.mime}}));
  } else if(path.includes('/object/upload/sign/') && !url.searchParams.has('token')) {
    result={url:path.replace('/storage/v1','')+'?token=synthetic-scoped-token'};
  } else if(path.includes('/object/sign/'))result={signedURL:'/object/synthetic-file.pdf'};
  else if(path.includes('/object/')) {
    const rest=path.split('/object/')[1].replace(/^upload\/sign\//,''),[bucket,...parts]=rest.split('/'),objectPath=parts.join('/');
    const call={bucket,path:objectPath,method:req.method,size:raw.length,mime:req.headers['content-type']};state.uploadCalls.push(call);
    if(state.delayUpload)await new Promise(resolve=>setTimeout(resolve,state.delayUpload));
    if(state.denyUpload){send({statusCode:'403',message:'Forbidden'},403);return;}
    if(state.failUpload){req.socket.destroy();return;}
    if(state.failDirect && !url.searchParams.has('token')){req.socket.destroy();return;}
    if(state.objects.has(rest)){send({statusCode:'409',message:'The resource already exists'},409);return;}
    state.objects.set(rest,{...call,size:raw.length});
    if(state.loseUpload){state.loseUpload=false;req.socket.destroy();return;}
    result={Key:rest};
  }
  send(result);
});
await new Promise(resolve=>backend.listen(54445,'127.0.0.1',resolve));
process.env.VITE_SUPABASE_URL='http://127.0.0.1:54445';process.env.VITE_SUPABASE_PUBLISHABLE_KEY='synthetic-publishable-key';process.env.VITE_GOOGLE_CLIENT_ID='';
const vite=await createViteServer({server:{host:'127.0.0.1',port:5190,strictPort:true,open:false}});await vite.listen();
const browser=await chromium.launch({headless:true});
let checks=0;
const pass=name=>{checks++;console.log('PASS '+name);};
async function open(width=390,uid=OWNER,expires=3600,path) {
  const context=await browser.newContext({viewport:{width,height:920},isMobile:width<900,hasTouch:width<900});
  await context.addInitScript(value=>{if(!localStorage.getItem('sb-127-auth-token'))localStorage.setItem('sb-127-auth-token',value);},JSON.stringify(session(uid,expires)));
  const page=await context.newPage();await page.goto('http://127.0.0.1:5190'+(path??(uid===OWNER?'/my-events':uid===FINANCE?'/admin':'/admin/registrations')));
  page.on('pageerror',e=>console.log('fixture page error:',e.message));
  await page.locator(path?'[data-participation],[data-d-participation]':uid===OWNER?'[data-r2-start],[data-r2-entry]':'[data-r2-review]').first().waitFor();
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(()=>!document.getElementById('app')?.inert && !document.getElementById('striatum-startup'));
  return {context,page};
}
async function start(page){if(await page.locator('[data-r2-start]').count())await page.locator('[data-r2-start]').click();await page.locator('[data-r2-submit]').waitFor();}
async function select(page) {
  await page.locator('[name=abstract]').setInputFiles({name:'Round2.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF synthetic abstract')});
  await page.waitForFunction(()=>document.querySelector('.r2-file-name')?.textContent?.includes('Selected')||[...document.querySelectorAll('.r2-file-name')].some(e=>e.textContent.includes('Round2.pdf')));
  await page.locator('[name=payment]').setInputFiles({name:'Proof.png',mimeType:'image/png',buffer:Buffer.from('synthetic proof bytes')});
  await page.waitForFunction(()=>[...document.querySelectorAll('.r2-file-name')].some(e=>e.textContent.includes('Proof.png')));
}
async function submit(page) {await page.locator('[data-r2-submit] button[type=submit]').click();}
async function reviewed(page) {await page.waitForFunction(()=>document.querySelector('.r2-statuses')?.textContent.includes('PAYMENT: UNDER REVIEW'));}
try {
  if (!process.env.R2_REVIEW_ONLY) {
  for(const width of [360,390,430,1440]) {
    reset();const {context,page}=await open(width);await start(page);await select(page);
    await page.evaluate(async()=>{(await import('/src/state/appStore.ts')).appStore.refresh();});
    assert.match(await page.locator('[data-r2-submit]').innerText(),/Selected: Round2.pdf/);
    await page.screenshot({path:artifacts+'/round-two-'+width+'.png',fullPage:true});
    await submit(page);await reviewed(page);assert.equal(state.submitCalls,1);assert.equal(state.objects.size,2);
    assert(state.uploadCalls.every(c=>!c.mime.includes('multipart')&&c.size>0));
    await page.reload();await reviewed(page);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await context.close();pass(width+'px selection, real binary upload, submit, reload, no overflow');
  }
  for(const scenario of ['loseUpload','failDirect','loseSubmit']) {
    reset({[scenario]:true});const {context,page}=await open();await start(page);await select(page);await submit(page);await reviewed(page);
    assert.equal(state.objects.size,2);assert.equal(state.submitCalls,1);assert.equal(state.entries[0].round_two_attempts.length,1);
    if(scenario==='failDirect')assert(state.uploadCalls.some(c=>c.method==='PUT'));
    await context.close();pass(scenario+' recovers with immutable paths, one submission');
  }
  reset({submitReject:true});{
    const {context,page}=await open();await start(page);await select(page);await submit(page);
    await page.waitForFunction(()=>document.querySelector('.r2-error')?.textContent.includes('could not be confirmed'));
    assert.equal(state.objects.size,2);await page.reload();await page.locator('[data-r2-submit]').waitFor();
    assert.match(await page.locator('[data-r2-submit]').innerText(),/Uploaded: Round2.pdf/);
    state.submitReject=false;await submit(page);await reviewed(page);assert.equal(state.uploadCalls.length,2);
    await context.close();pass('reload resumes verified server files without reselecting or reuploading');
  }
  reset({failUpload:true});{
    const {context,page}=await open();await start(page);await select(page);await submit(page);
    await page.waitForFunction(()=>document.querySelector('.r2-error')?.textContent.includes('could not be confirmed'));
    await page.evaluate(async()=>{(await import('/src/state/appStore.ts')).appStore.refresh();});
    assert.match(await page.locator('.r2-error').innerText(),/could not be confirmed/);
    const first=state.uploadCalls[0].path;state.failUpload=false;await submit(page);await reviewed(page);assert.equal(state.uploadCalls[2].path,first);
    const diagnostics=await page.evaluate(async()=>JSON.parse((await import('/src/services/roundTwoDiagnostics.ts')).roundTwoDiagnosticReport()));
    assert(diagnostics.events.some(e=>e.outcome==='fetch-type-error'));
    assert(!JSON.stringify(diagnostics).includes(OWNER));assert(!JSON.stringify(diagnostics).includes('Proof.png'));assert(!JSON.stringify(diagnostics).includes('synthetic-scoped-token'));
    await context.close();pass('two transport failures, rerendered error, same-path retry, redacted diagnostics');
  }
  reset({denyUpload:true});{
    const {context,page}=await open();await start(page);await select(page);await submit(page);
    await page.waitForFunction(()=>document.querySelector('.r2-error')?.textContent.includes('permission'));
    assert.equal(state.uploadCalls.length,1);assert.equal(state.submitCalls,0);
    await context.close();pass('403 permission denial is terminal, no fallback/retry storm');
  }
  reset({delayUpload:1200});{
    const {context,page}=await open();await start(page);await select(page);await submit(page);
    await page.waitForFunction(()=>document.querySelector('.r2-progress')?.textContent.includes('Uploading'));
    await page.evaluate(async()=>{(await import('/src/state/appStore.ts')).appStore.refresh();});
    assert(await page.locator('[data-r2-submit] button[type=submit]').isDisabled());assert(await page.locator('[data-r2-remove]').isDisabled());
    await page.locator('[data-r2-submit]').evaluate(form=>{form.requestSubmit();form.requestSubmit();});
    await reviewed(page);assert.equal(state.submitCalls,1);
    await context.close();pass('mid-upload rerender preserves progress and locks duplicate submit/remove');
  }
  reset();{
    const {context,page}=await open(390,OWNER,1);await start(page);await select(page);await submit(page);await reviewed(page);assert(state.refreshes>=1);
    await context.close();pass('expired session refresh before upload');
  }
  reset({delayUpload:1200});{
    const {context,page}=await open();await start(page);await select(page);await submit(page);
    await page.waitForFunction(()=>document.querySelector('.r2-progress')?.textContent.includes('Uploading'));
    const finished=page.waitForResponse(r=>r.url().includes('/storage/v1/object/')&&r.request().method()==='POST');
    await page.evaluate(async()=>{await (await import('/src/services/authService.ts')).signOut();});
    await finished;await page.waitForLoadState('networkidle');
    assert.equal(state.submitCalls,0);assert.equal(await page.locator('[data-r2-entry]').count(),0);
    const recovered=await page.evaluate(()=>Object.keys(sessionStorage).filter(k=>k.startsWith('striatum-r2-uploads')));assert.equal(recovered.length,0);
    await context.close();pass('sign-out during upload clears selections/recovery and prevents final submit');
  }
  reset();{
    const {context,page}=await open();await start(page);await page.locator('[data-r2-remove]').click();assert.equal(state.entries.length,1);
    await page.locator('[data-r2-keep]').click();assert.equal(state.entries.length,1);
    await page.locator('[data-r2-remove]').click();await page.locator('[data-r2-remove]').click();await page.locator('[data-r2-start]').waitFor();assert.equal(state.entries.length,0);
    await start(page);await select(page);assert(await page.locator('[data-r2-remove]').isDisabled());
    await context.close();pass('REMOVE/KEEP IT two-step draft flow and proof protection');
  }
  for(const width of [390,1440]) {
    reset({newParticipant:true});const {context,page}=await open(width,OWNER,3600,'/event/s4-18');
    assert.match(await page.locator('body').innerText(),/4/);
    await page.locator('[data-participation=team],[data-d-participation=team]').click();
    await page.getByRole('button',{name:'REGISTER FOR ROUND 2',exact:true}).click();
    await page.locator('[data-reg-add]').waitFor();
    while(await page.locator('[data-reg-add]').count())await page.locator('[data-reg-add]').click();
    const positions=await page.locator('[data-reg-field=name]').count();assert.equal(positions,4);
    const fields=page.locator('[data-reg-field]');
    for(let i=0;i<await fields.count();i++) {
      const field=fields.nth(i),key=await field.getAttribute('data-reg-field');
      if(await field.evaluate(el=>el.tagName)==='SELECT') {
        const value=await field.locator('option').evaluateAll(options=>options.map(o=>o.value).filter(Boolean)[0]);await field.selectOption(value);
      } else await field.fill(({name:'Synthetic '+i,college:'Test College',phone:'9999999999',email:'fixture@example.test'})[key]??'2024');
    }
    await page.getByRole('button',{name:'CONTINUE TO ROUND 2',exact:true}).click();await page.locator('[data-r2-entry]').waitFor();
    assert.equal(state.startCalls.length,1);assert.equal(state.startCalls[0].p_team.participants.length,4);assert.equal(state.entries[0].fee,500);
    await page.goBack();await page.goForward();await page.locator('[data-r2-entry]').waitFor();assert.equal(state.startCalls.length,1);
    assert(!state.calls.some(path=>path.endsWith('/create_order')));
    await context.close();pass(width+'px NEURONOVA four-person roster, ₹500, dedicated start, back/forward no duplicate');
  }
  }
  reset();{
    const {context,page}=await open();await start(page);await select(page);await submit(page);await reviewed(page);await context.close();
    state.uid=FINANCE;const f=await open(1440,FINANCE);await f.page.getByRole('button',{name:'APPROVE PAYMENT',exact:true}).click();
    await f.page.waitForFunction(()=>document.querySelector('[data-r2-review]')===null);await f.context.close();
    state.uid=ADMIN;const a=await open(390,ADMIN);
    assert.equal(await a.page.getByRole('button',{name:'VIEW PAYMENT PROOF',exact:true}).count(),0);
    await a.page.locator('[data-r2-review] [name=reason]').fill('Add methods.');
    await a.page.evaluate(async()=>{(await import('/src/state/appStore.ts')).appStore.refresh();});
    assert.equal(await a.page.locator('[data-r2-review] [name=reason]').inputValue(),'Add methods.');
    await a.page.getByRole('button',{name:'REQUEST CORRECTION',exact:true}).click();
    await a.page.waitForFunction(()=>document.querySelector('[data-r2-review]')===null);await a.context.close();
    state.uid=OWNER;const o=await open();assert.equal(await o.page.locator('[name=payment]').count(),0);
    await o.page.locator('[name=abstract]').setInputFiles({name:'Corrected.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF correction')});
    await o.page.waitForFunction(()=>document.querySelector('.r2-file-name')?.textContent.includes('Corrected'));
    const proof=state.entries[0].round_two_attempts[0].proof_path;await submit(o.page);
    await o.page.waitForFunction(()=>document.querySelector('.r2-statuses')?.textContent.includes('ABSTRACT: UNDER REVIEW'));
    assert.equal(state.entries[0].round_two_attempts.at(-1).proof_path,proof);assert.equal(state.uploadCalls.length,3);
    await o.context.close();pass('finance approval, organiser rejection, correction retains approved proof');
  }
  console.log('PASS '+checks+' browser scenarios; all data synthetic; live backend never contacted');
} finally { await browser.close();await vite.close();await new Promise(resolve=>backend.close(resolve)); }
