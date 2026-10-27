import { roundTwoDiagnosticReport } from '../services/roundTwoDiagnostics.ts';
import { renderAdditionalAbstracts, renderAdminAdditionalAbstracts, attachAdditionalAbstracts } from './ExtraAbstracts.ts';
import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import * as roundTwo from '../services/roundTwoService.ts';
import { getEvent } from '../data/events.ts';
import { escapeHtml as esc } from '../services/text.ts';
import { formatINR } from '../services/pricing.ts';
import { SYMPOSIUM_UPI_ID, SYMPOSIUM_UPI_QR } from '../data/payment.ts';

const label = (status: string) => status.replace(/_/g,' ').toUpperCase();
const busy = new Set<string>();
let confirmingDraftId: string | null = null;

function evidence(a: roundTwo.RoundTwoAttempt, kind: 'abstract' | 'payment'): string {
  return `<button type="button" class="action-link-cyan" data-r2-file="${esc(kind==='abstract'?a.abstract_path:a.proof_path)}" data-r2-kind="${kind}">${kind==='abstract'?esc(a.abstract_name):'VIEW PAYMENT PROOF'} ↗</button>`;
}

function fileField(entry: roundTwo.RoundTwoEntry, kind: 'abstract' | 'payment'): string {
  const file = roundTwo.stagedFiles(entry.id)[kind];
  const saved = roundTwo.recoverableFile(entry.id, kind);
  const name = file?.name ?? saved?.name;
  const payment = kind === 'payment';
  return `<div class="r2-file-field"><label class="input-field-label" for="r2-${kind}-${entry.id}">${payment ? '01 / PAYMENT PROOF' : '02 / ABSTRACT'}<span>${payment ? 'JPG, PNG, PDF · 5 MB' : 'PDF, Word, PowerPoint · 10 MB'}</span></label>
    <input class="text-input-field" id="r2-${kind}-${entry.id}" name="${kind}" type="file" accept="${payment ? '.jpg,.jpeg,.png,.pdf' : '.pdf,.doc,.docx,.ppt,.pptx'}" ${name ? '' : 'required'} ${roundTwo.roundTwoOperation(entry.id).busy ? 'disabled' : ''} />
    <p class="r2-file-name">${name ? `${file ? 'Selected' : saved?.confirmed ? 'Uploaded' : 'Resume upload'}: ${esc(name)}` : 'Choose a file from this device'}</p></div>`;
}

export function renderRoundTwoHub(): string {
  if (!registration.isRemote()) return '';
  const entries = roundTwo.myRoundTwo();
  const available = registration.roundTwoRegistrations();
  const error = roundTwo.roundTwoError();
  if (!entries.length && !available.length && !error) return '';
  return `<section class="r2-section r2-hub" aria-label="Round 2 registrations">
    <div class="r2-heading"><div class="section-index-label"><span class="cyan-num">R2</span><span class="slash">/</span><span class="section-name">ROUND 2</span></div><button class="action-link-cyan" data-r2-refresh>REFRESH STATUS</button></div>
    <p class="r2-intro">Your next round. Upload once, track both reviews here.</p>
    ${error ? `<p role="alert" class="reg-error-line">${esc(error)}</p>` : ''}
    ${available.filter(r=>!entries.some(e=>e.registration_id===r.id)).map(r=>`<article class="r2-entry r2-entry--start">
      <h3 class="myevents-row-title">${esc(getEvent(r.eventId)?.name ?? r.eventId)}</h3><p class="r2-reference">ENTRY ${r.teamIndex ?? 1} · ${esc(registration.getOrder(r.orderId)?.reference ?? '')}</p>
      <button class="btn-chamfer-primary" data-r2-start="${r.id}" data-r2-event="${r.eventId}" ${busy.has(r.id)?'disabled':''}>CONTINUE TO ROUND 2 →</button>
    </article>`).join('')}
    ${entries.map(entry=>{
      const editable = entry.payment_status==='draft' || entry.payment_status==='rejected' || entry.submission_status==='rejected';
      const complete = entry.payment_status==='approved' && entry.submission_status==='approved';
      const original = available.find(r=>r.id===entry.registration_id);
      const a = roundTwo.latestAttempt(entry);
      const op = roundTwo.roundTwoOperation(entry.id);
      const locked = op.busy || busy.has(entry.id);
      const removable = entry.payment_status==='draft' && entry.submission_status==='draft' && !entry.round_two_attempts.length;
      const proofSelected = roundTwo.hasRoundTwoFile(entry.id,'payment');
      return `<article class="r2-entry" data-r2-entry="${entry.id}">
        <header class="r2-entry-heading"><div><h3 class="myevents-row-title">${esc(getEvent(entry.event_id)?.name ?? entry.event_id)}</h3><p class="r2-reference">ROUND 2 · ${entry.id.slice(0,8).toUpperCase()}${original ? ` · ENTRY ${original.teamIndex ?? 1}` : ''}</p></div><div class="r2-fee"><span>ROUND 2 FEE</span><strong>${formatINR(entry.fee)}</strong></div></header>
        <div class="r2-statuses"><span data-status="${entry.payment_status}">PAYMENT: ${label(entry.payment_status)}</span><span data-status="${entry.submission_status}">ABSTRACT: ${label(entry.submission_status)}</span></div>
        ${complete?'<p class="r2-confirmed">ROUND 2 CONFIRMED</p>':''}
        ${a?.payment_reason?`<p class="reg-error-line">Payment: ${esc(a.payment_reason)}</p>`:''}
        ${a?.submission_reason?`<p class="reg-error-line">Abstract: ${esc(a.submission_reason)}</p>`:''}
        ${editable?`<form data-r2-submit="${entry.id}" class="r2-form" aria-busy="${op.busy}">
          ${entry.payment_status==='approved'?'<p class="r2-retained">Payment approved. No further payment is required.</p>':`<div class="r2-payment"><div class="r2-pay-line"><span>${esc(SYMPOSIUM_UPI_ID)}</span><a class="action-link-cyan" href="upi://pay?pa=${encodeURIComponent(SYMPOSIUM_UPI_ID)}&am=${entry.fee}&cu=INR&tn=${encodeURIComponent('STRIATUM R2 '+entry.id.slice(0,8))}">PAY ${formatINR(entry.fee)} ↗</a></div><details class="r2-payment-details"><summary>QR & payment reference</summary><img class="r2-qr" src="${SYMPOSIUM_UPI_QR}" alt="UPI payment QR for ${esc(SYMPOSIUM_UPI_ID)}" /><p>Use reference <strong>${entry.id.slice(0,8).toUpperCase()}</strong> in the payment note.</p></details><p class="r2-payment-note">Already paid? Upload that proof. Do not pay again.</p></div>${fileField(entry,'payment')}`}
          ${entry.submission_status==='approved'?'<p class="r2-retained">Your approved Round 2 abstract is retained.</p>':fileField(entry,'abstract')}
          <p class="r2-progress" role="status" aria-live="polite">${esc(op.progress)}</p><p class="r2-error reg-error-line" role="alert">${esc(op.error)}</p>
          <button class="btn-chamfer-primary" type="submit" ${locked?'disabled':''}>${op.busy?'SUBMITTING…':'SUBMIT ROUND 2 FOR REVIEW →'}</button>
          <button type="button" class="r2-diagnostics action-link-cyan" data-r2-diagnostics>Copy upload diagnostics</button>
        </form>`:'<p class="r2-review-note">Both reviews must be approved to confirm your place.</p>'}
        ${removable ? `<div class="myevents-remove-row"><button type="button" class="myevents-remove-btn ${confirmingDraftId===entry.id?'is-armed':''}" data-r2-remove="${entry.id}" ${locked||proofSelected?'disabled':''}>${confirmingDraftId===entry.id?'TAP AGAIN TO REMOVE':'REMOVE'}</button>${confirmingDraftId===entry.id?'<button type="button" class="myevents-remove-cancel" data-r2-keep>KEEP IT</button>':''}</div>${proofSelected?'<p class="r2-payment-note">Proof attached — keep this entry if you have paid.</p>':confirmingDraftId===entry.id?'<p class="myevents-remove-note">Remove this unfinished Round 2 entry? If you already paid, keep it and contact the organisers. Earlier registrations stay on record.</p>':''}` : ''}
        ${renderAdditionalAbstracts(entry)}
        <details class="r2-history"><summary>${entry.round_two_attempts.length ? `Submission history · ${entry.round_two_attempts.length}` : 'About this round'}</summary><p>Round 2 has a separate fee and abstract. Earlier payments and Round 1 files stay on record.</p>${[...entry.round_two_attempts].sort((a,b)=>b.attempt_number-a.attempt_number).map(at=>`<div class="r2-history-item"><p>${esc(new Date(at.submitted_at).toLocaleString('en-IN'))} · PAYMENT ${label(at.payment_status)} · ABSTRACT ${label(at.submission_status)}</p>${evidence(at,'abstract')}${evidence(at,'payment')}</div>`).join('')}</details>
      </article>`;
    }).join('')}
  </section>`;
}

export function renderRoundTwoAdmin(kind: 'payment' | 'submission', eventId?: string): string {
  const entries = roundTwo.allRoundTwo().filter(e=>!eventId || e.event_id===eventId);
  if (roundTwo.roundTwoError()) return `<p role="alert">${esc(roundTwo.roundTwoError())}</p><button class="action-link-cyan" data-r2-refresh>RETRY ROUND 2</button>`;
  return `<section class="r2-section" aria-label="Round 2 ${kind} review"><div class="section-index-label"><span class="cyan-num">R2</span><span class="slash">/</span><span class="section-name">ROUND 2 · ${kind==='payment'?'PAYMENT VERIFICATION':'ABSTRACT REVIEW'}</span></div>
    <button class="action-link-cyan" data-r2-refresh>REFRESH ROUND 2 STATUS ↻</button>
    ${kind==='payment'?`<p class="explore-subtitle">Verified Round 2 revenue: ${formatINR(entries.filter(e=>e.payment_status==='approved').reduce((sum,e)=>sum+e.fee,0))} · Pending: ${formatINR(entries.filter(e=>e.payment_status==='under_review').reduce((sum,e)=>sum+e.fee,0))}</p>`:''}
    ${entries.map(entry=>{
      const a = roundTwo.latestAttempt(entry);
      return `<div class="admin-panel"><h3 class="myevents-row-title">${esc(getEvent(entry.event_id)?.name ?? entry.event_id)} · ${entry.id.slice(0,8).toUpperCase()}</h3>
        <p class="myevents-row-sub">Registration ${entry.registration_id} · ${label(entry[kind==='payment'?'payment_status':'submission_status'])}${kind==='payment'?` · ${formatINR(entry.fee)}`:''}</p>
        <p class="myevents-row-sub">${esc(roundTwo.rosterFor(entry.id).map(p=>`${p.name} (${p.college || 'college not recorded'})`).join(' · ') || 'Participant details not recorded')}</p>
        ${a?`<div class="r2-review-evidence" aria-label="Round 2 submitted documents">${registration.isFinanceAdmin()?evidence(a,'payment'):''}${evidence(a,'abstract')}</div>
          ${a[kind==='payment'?'payment_status':'submission_status']==='under_review'?`<form class="r2-review" data-r2-review="${a.id}" data-r2-kind="${kind}">
            <label class="input-field-label" for="r2-reason-${a.id}-${kind}">Reason if requesting correction</label><textarea class="text-input-field" id="r2-reason-${a.id}-${kind}" name="reason" maxlength="2000">${esc(roundTwo.roundTwoReviewDraft(a.id,kind).reason)}</textarea>
            <p class="r2-error reg-error-line" role="alert">${esc(roundTwo.roundTwoReviewDraft(a.id,kind).error)}</p>
            <div class="admin-action-row"><button type="submit" name="decision" value="approve" class="btn-chamfer-primary" ${roundTwo.roundTwoReviewDraft(a.id,kind).busy?'disabled':''}>APPROVE ${kind.toUpperCase()}</button><button type="submit" name="decision" value="reject" class="btn-chamfer-dark" ${roundTwo.roundTwoReviewDraft(a.id,kind).busy?'disabled':''}>REQUEST CORRECTION</button></div>
          </form>`:`<p>${esc(a[kind==='payment'?'payment_reason':'submission_reason'] ?? '')}</p>`}
          ${renderAdminAdditionalAbstracts(entry,kind)}
          <details class="r2-history"><summary>Earlier attempts and review history</summary>${entry.round_two_attempts.map(at=>`<div class="r2-history-item"><p>${esc(new Date(at.submitted_at).toLocaleString('en-IN'))} · ${label(at[kind==='payment'?'payment_status':'submission_status'])}</p>${evidence(at,kind==='payment'?'payment':'abstract')}<p>${esc(at[kind==='payment'?'payment_reason':'submission_reason'] ?? '')}</p></div>`).join('')}</details>`:'<p>Awaiting payment and abstract upload.</p>'}
      </div>`;
    }).join('') || '<p class="explore-subtitle">No Round 2 entries yet.</p>'}
  </section>`;
}

export function attachRoundTwo(): void {
  syncRoundTwoForms();
  attachAdditionalAbstracts();
  document.querySelectorAll<HTMLButtonElement>('[data-r2-diagnostics]').forEach(button=>button.addEventListener('click',async()=>{
    try { await navigator.clipboard.writeText(roundTwoDiagnosticReport()); appStore.showToast('Upload diagnostics copied. Share these with the organisers.'); }
    catch { appStore.showToast('Clipboard unavailable. Open this page in your browser to copy diagnostics.'); }
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-r2-remove]').forEach(button=>button.addEventListener('click',async()=>{
    const id=button.dataset.r2Remove!;
    if (busy.has(id)) return;
    if (confirmingDraftId!==id) { confirmingDraftId=id; appStore.refresh(); return; }
    const entry=roundTwo.myRoundTwo().find(e=>e.id===id);
    if (!entry) { confirmingDraftId=null; appStore.refresh(); return; }
    busy.add(id); button.disabled=true;
    try {
      await roundTwo.removeDraftRoundTwo(entry);
      await registration.hydrate();
      appStore.showToast('Unsubmitted Round 2 entry removed.');
    } catch(error) {
      appStore.showToast(error instanceof Error?error.message:'Unable to remove entry.');
    } finally { confirmingDraftId=null; busy.delete(id); appStore.refresh(); }
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-r2-keep]').forEach(button=>button.addEventListener('click',()=>{
    confirmingDraftId=null; appStore.refresh();
  }));
  document.querySelectorAll<HTMLFormElement>('[data-r2-submit]').forEach(form=>{
    form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach(input=>input.addEventListener('change',async()=>{
      try { await roundTwo.stageFile(form.dataset.r2Submit!,input.name as 'abstract'|'payment',input.files?.[0]); }
      catch { /* The service retains a readable error through remounts. */ }
      finally { appStore.refresh(); }
    }));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-r2-refresh]').forEach(button=>button.addEventListener('click',async()=>{
    button.disabled=true;
    try { await registration.hydrate(); }
    catch { appStore.showToast('Unable to refresh. Please try again.'); }
    finally { button.disabled=false; appStore.refresh(); }
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-r2-start]').forEach(button=>button.addEventListener('click',async()=>{
    const id=button.dataset.r2Start!; if (busy.has(id)) return; busy.add(id); button.disabled=true;
    try { await roundTwo.startRoundTwo(button.dataset.r2Event!,id); }
    catch(error) { appStore.showToast(error instanceof Error?error.message:'Unable to start Round 2.'); }
    finally { busy.delete(id); appStore.refresh(); }
  }));
  document.querySelectorAll<HTMLFormElement>('[data-r2-submit]').forEach(form=>form.addEventListener('submit',async event=>{
    event.preventDefault(); const id=form.dataset.r2Submit!;
    const entry=roundTwo.myRoundTwo().find(e=>e.id===id); if (!entry || busy.has(id)) return;
    busy.add(id); const button=form.querySelector<HTMLButtonElement>('button[type="submit"]')!; button.disabled=true;
    const status=form.querySelector<HTMLElement>('.r2-progress')!;
    const abstract=roundTwo.stagedFiles(id).abstract;
    const proof=roundTwo.stagedFiles(id).payment;
    const labels={abstract:'Uploading abstract…', payment:'Uploading payment proof…', saving:'Saving submission for review…'};
    form.querySelector('.r2-error')!.textContent='';
    button.textContent='UPLOADING…';
    try {
      await roundTwo.submitRoundTwo(entry,abstract,proof,stage=>{
        status.textContent=labels[stage];
        button.textContent=labels[stage].toUpperCase();
      });
      busy.delete(id); appStore.showToast('Round 2 submitted for review.'); appStore.refresh();
    }
    catch { appStore.refresh(); }
    finally { busy.delete(id); syncRoundTwoForms(); }
  }));
  document.querySelectorAll<HTMLFormElement>('[data-r2-review]').forEach(form=>{
    form.querySelector<HTMLTextAreaElement>('[name="reason"]')!.addEventListener('input',event=>{
      roundTwo.roundTwoReviewDraft(form.dataset.r2Review!,form.dataset.r2Kind!).reason=(event.target as HTMLTextAreaElement).value;
    });
    form.addEventListener('submit',async event=>{
    event.preventDefault(); const id=form.dataset.r2Review!; const kind=form.dataset.r2Kind as 'payment'|'submission';
    if (busy.has(id)) return;
    const approve=(event as SubmitEvent).submitter?.getAttribute('value')==='approve';
    const reason=form.querySelector<HTMLTextAreaElement>('[name="reason"]')!.value.trim();
    if (!approve && !reason) { roundTwo.roundTwoReviewDraft(id,kind).error='Enter a reason for the participant.'; appStore.refresh(); return; }
    busy.add(id); form.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);
    try { await roundTwo.reviewRoundTwo(id,kind,approve,reason); appStore.showToast('Round 2 review saved.'); appStore.refresh(); }
    catch { appStore.refresh(); }
    finally { busy.delete(id); form.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=false); }
  }); });
  document.querySelectorAll<HTMLButtonElement>('[data-r2-file]').forEach(button=>button.addEventListener('click',async()=>{
    // Open synchronously so browsers do not block the secure file preview.
    const preview=window.open('about:blank','_blank'); if (preview) preview.opener=null;
    try { const url=await roundTwo.roundTwoFileUrl(button.dataset.r2File!,button.dataset.r2Kind as 'abstract'|'payment'); if (preview) preview.location.href=url; else appStore.showToast('Allow pop-ups to view the file.'); }
    catch(error) { preview?.close(); appStore.showToast(error instanceof Error?error.message:'File unavailable.'); }
  }));
}

function syncRoundTwoForms(): void {
  document.querySelectorAll<HTMLFormElement>('[data-r2-submit]').forEach(form=>{
    const id = form.dataset.r2Submit!;
    const op = roundTwo.roundTwoOperation(id);
    form.setAttribute('aria-busy', String(op.busy));
    form.querySelector('.r2-progress')!.textContent = op.progress;
    form.querySelector('.r2-error')!.textContent = op.error;
    form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach(input=>{
      input.disabled=op.busy;
      const file=roundTwo.stagedFiles(id)[input.name as 'abstract'|'payment'];
      if (file && !input.files?.length) {
        try { const transfer=new DataTransfer(); transfer.items.add(file); input.files=transfer.files; }
        catch { /* Selected filename below remains authoritative. */ }
      }
    });
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    submit.disabled = op.busy;
    submit.textContent = op.busy ? (op.progress || 'SUBMITTING…').toUpperCase() : 'SUBMIT ROUND 2 FOR REVIEW →';
    const remove = form.closest('[data-r2-entry]')?.querySelector<HTMLButtonElement>('[data-r2-remove]');
    if (remove) remove.disabled = op.busy || roundTwo.hasRoundTwoFile(id,'payment');
  });
}
window.addEventListener('striatum:r2-state', syncRoundTwoForms);
