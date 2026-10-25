import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import * as roundTwo from '../services/roundTwoService.ts';
import { getEvent } from '../data/events.ts';
import { escapeHtml as esc } from '../services/text.ts';
import { formatINR } from '../services/pricing.ts';
import { SYMPOSIUM_UPI_ID, SYMPOSIUM_UPI_QR } from '../data/payment.ts';

const label = (status: string) => status.replace(/_/g,' ').toUpperCase();
const busy = new Set<string>();

function evidence(a: roundTwo.RoundTwoAttempt, kind: 'abstract' | 'payment'): string {
  return `<button type="button" class="action-link-cyan" data-r2-file="${esc(kind==='abstract'?a.abstract_path:a.proof_path)}" data-r2-kind="${kind}">${kind==='abstract'?esc(a.abstract_name):'VIEW PAYMENT PROOF'} ↗</button>`;
}

export function renderRoundTwoHub(): string {
  if (!registration.isRemote()) return '';
  const entries = roundTwo.myRoundTwo();
  const available = registration.roundTwoRegistrations();
  const error = roundTwo.roundTwoError();
  if (!entries.length && !available.length && !error) return '';
  return `<section class="r2-section" aria-label="Round 2 registrations">
    <div class="section-index-label"><span class="cyan-num">R2</span><span class="slash">/</span><span class="section-name">ROUND 2 · FEES & SUBMISSIONS</span></div>
    <p class="explore-subtitle">Round 2 requires a separate fee and abstract for every entry, including existing Round 1 registrants. Your earlier payments and files remain on record.</p>
    <button class="action-link-cyan" data-r2-refresh>REFRESH ROUND 2 STATUS ↻</button>
    ${error ? `<p role="alert">${esc(error)}</p><button class="action-link-cyan" data-r2-refresh>RETRY</button>` : ''}
    ${available.filter(r=>!entries.some(e=>e.registration_id===r.id)).map(r=>`<div class="admin-panel">
      <h3 class="myevents-row-title">${esc(getEvent(r.eventId)?.name ?? r.eventId)} · ENTRY ${r.teamIndex ?? 1}</h3>
      <p class="myevents-row-sub">Original order ${esc(registration.getOrder(r.orderId)?.reference ?? r.orderId)}</p>
      <button class="btn-chamfer-primary" data-r2-start="${r.id}" data-r2-event="${r.eventId}" ${busy.has(r.id)?'disabled':''}>CONTINUE TO ROUND 2 →</button>
    </div>`).join('')}
    ${entries.map(entry=>{
      const a = roundTwo.latestAttempt(entry);
      const editable = entry.payment_status==='draft' || entry.payment_status==='rejected' || entry.submission_status==='rejected';
      const complete = entry.payment_status==='approved' && entry.submission_status==='approved';
      const original = available.find(r=>r.id===entry.registration_id);
      return `<div class="admin-panel" data-r2-entry="${entry.id}">
        <h3 class="myevents-row-title">${esc(getEvent(entry.event_id)?.name ?? entry.event_id)} · ROUND 2${original ? ` · ENTRY ${original.teamIndex ?? 1}`:''}</h3>
        <p class="myevents-row-sub">${original ? `Original order ${esc(registration.getOrder(original.orderId)?.reference ?? original.orderId)} · `:''}Reference ${entry.id.slice(0,8).toUpperCase()}</p>
        <div class="admin-ledger-row"><span>ROUND 2 FEE</span><strong>${formatINR(entry.fee)}</strong></div>
        <p class="myevents-row-sub">PAYMENT: ${label(entry.payment_status)} · ABSTRACT: ${label(entry.submission_status)}</p>
        ${complete?'<span class="status-pill status-pill--confirmed">ROUND 2 CONFIRMED</span>':''}
        ${a?.payment_reason?`<p class="reg-error-line">Payment: ${esc(a.payment_reason)}</p>`:''}
        ${a?.submission_reason?`<p class="reg-error-line">Abstract: ${esc(a.submission_reason)}</p>`:''}
        ${editable?`<form data-r2-submit="${entry.id}" class="r2-form">
          ${entry.payment_status==='approved'?'<p>Payment approved. No further payment is required.</p>':`<p>Pay <strong>${formatINR(entry.fee)}</strong> to <strong>${esc(SYMPOSIUM_UPI_ID)}</strong>. Include reference ${entry.id.slice(0,8).toUpperCase()} in the payment note.</p>
            <img class="r2-qr" src="${SYMPOSIUM_UPI_QR}" alt="UPI payment QR for ${esc(SYMPOSIUM_UPI_ID)}" />
            <a class="action-link-cyan" href="upi://pay?pa=${encodeURIComponent(SYMPOSIUM_UPI_ID)}&am=${entry.fee}&cu=INR&tn=${encodeURIComponent('STRIATUM R2 '+entry.id.slice(0,8))}">PAY ${formatINR(entry.fee)} VIA UPI ↗</a>
            <label class="input-field-label" for="r2-payment-${entry.id}">Round 2 payment proof · JPEG, PNG or PDF · up to 5 MB</label>
            <input class="text-input-field" id="r2-payment-${entry.id}" name="payment" type="file" accept="image/jpeg,image/png,application/pdf" ${roundTwo.stagedFiles(entry.id).payment?'':'required'} />
            ${roundTwo.stagedFiles(entry.id).payment?`<p>Selected: ${esc(roundTwo.stagedFiles(entry.id).payment!.name)}</p>`:''}`}
          ${entry.submission_status==='approved'?'<p>Your approved Round 2 abstract is retained.</p>':`<label class="input-field-label" for="r2-abstract-${entry.id}">Round 2 abstract · PDF, Word or PowerPoint · up to 10 MB</label>
            <input class="text-input-field" id="r2-abstract-${entry.id}" name="abstract" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" ${roundTwo.stagedFiles(entry.id).abstract?'':'required'} />
            ${roundTwo.stagedFiles(entry.id).abstract?`<p>Selected: ${esc(roundTwo.stagedFiles(entry.id).abstract!.name)}</p>`:''}`}
          <p class="r2-error reg-error-line" role="alert"></p>
          <button class="btn-chamfer-primary" type="submit" ${busy.has(entry.id)?'disabled':''}>${busy.has(entry.id)?'SUBMITTING…':'SUBMIT ROUND 2 FOR REVIEW →'}</button>
        </form>`:'<p class="explore-subtitle">Track payment and abstract review here. Round 2 is confirmed when both are approved.</p>'}
        ${entry.round_two_attempts.length?`<details class="r2-history"><summary>Round 2 submission history (${entry.round_two_attempts.length})</summary>${[...entry.round_two_attempts].sort((a,b)=>b.attempt_number-a.attempt_number).map(at=>`<div class="r2-history-item"><p>${esc(new Date(at.submitted_at).toLocaleString('en-IN'))} · PAYMENT ${label(at.payment_status)} · ABSTRACT ${label(at.submission_status)}</p>${evidence(at,'abstract')}${evidence(at,'payment')}</div>`).join('')}</details>`:''}
      </div>`;
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
        ${a?`${evidence(a,kind==='payment'?'payment':'abstract')}
          ${a[kind==='payment'?'payment_status':'submission_status']==='under_review'?`<form class="r2-review" data-r2-review="${a.id}" data-r2-kind="${kind}">
            <label class="input-field-label" for="r2-reason-${a.id}-${kind}">Reason if requesting correction</label><textarea class="text-input-field" id="r2-reason-${a.id}-${kind}" name="reason" maxlength="2000"></textarea>
            <p class="r2-error reg-error-line" role="alert"></p>
            <div class="admin-action-row"><button type="submit" name="decision" value="approve" class="btn-chamfer-primary">APPROVE ${kind.toUpperCase()}</button><button type="submit" name="decision" value="reject" class="btn-chamfer-dark">REQUEST CORRECTION</button></div>
          </form>`:`<p>${esc(a[kind==='payment'?'payment_reason':'submission_reason'] ?? '')}</p>`}
          <details class="r2-history"><summary>Earlier attempts and review history</summary>${entry.round_two_attempts.map(at=>`<div class="r2-history-item"><p>${esc(new Date(at.submitted_at).toLocaleString('en-IN'))} · ${label(at[kind==='payment'?'payment_status':'submission_status'])}</p>${evidence(at,kind==='payment'?'payment':'abstract')}<p>${esc(at[kind==='payment'?'payment_reason':'submission_reason'] ?? '')}</p></div>`).join('')}</details>`:'<p>Awaiting payment and abstract upload.</p>'}
      </div>`;
    }).join('') || '<p class="explore-subtitle">No Round 2 entries yet.</p>'}
  </section>`;
}

export function attachRoundTwo(): void {
  document.querySelectorAll<HTMLFormElement>('[data-r2-submit]').forEach(form=>{
    form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach(input=>input.addEventListener('change',()=>{
      roundTwo.stageFile(form.dataset.r2Submit!,input.name as 'abstract'|'payment',input.files?.[0]);
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
    const abstract=roundTwo.stagedFiles(id).abstract;
    const proof=roundTwo.stagedFiles(id).payment;
    try { await roundTwo.submitRoundTwo(entry,abstract,proof); busy.delete(id); appStore.showToast('Round 2 submitted for review.'); appStore.refresh(); }
    catch(error) { form.querySelector('.r2-error')!.textContent=error instanceof Error?error.message:'Submission failed. Please retry.'; }
    finally { busy.delete(id); button.disabled=false; }
  }));
  document.querySelectorAll<HTMLFormElement>('[data-r2-review]').forEach(form=>form.addEventListener('submit',async event=>{
    event.preventDefault(); const id=form.dataset.r2Review!; const kind=form.dataset.r2Kind as 'payment'|'submission';
    if (busy.has(id)) return;
    const approve=(event as SubmitEvent).submitter?.getAttribute('value')==='approve';
    const reason=form.querySelector<HTMLTextAreaElement>('[name="reason"]')!.value.trim();
    if (!approve && !reason) { form.querySelector('.r2-error')!.textContent='Enter a reason for the participant.'; return; }
    busy.add(id); form.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);
    try { await roundTwo.reviewRoundTwo(id,kind,approve,reason); appStore.showToast('Round 2 review saved.'); appStore.refresh(); }
    catch(error) { form.querySelector('.r2-error')!.textContent=error instanceof Error?error.message:'Review failed.'; }
    finally { busy.delete(id); form.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=false); }
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-r2-file]').forEach(button=>button.addEventListener('click',async()=>{
    // Open synchronously so browsers do not block the secure file preview.
    const preview=window.open('about:blank','_blank'); if (preview) preview.opener=null;
    try { const url=await roundTwo.roundTwoFileUrl(button.dataset.r2File!,button.dataset.r2Kind as 'abstract'|'payment'); if (preview) preview.location.href=url; else appStore.showToast('Allow pop-ups to view the file.'); }
    catch(error) { preview?.close(); appStore.showToast(error instanceof Error?error.message:'File unavailable.'); }
  }));
}
