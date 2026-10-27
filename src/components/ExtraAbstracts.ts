import { appStore } from '../state/appStore.ts';
import * as extra from '../services/extraAbstractService.ts';
import * as roundTwo from '../services/roundTwoService.ts';
import { escapeHtml as esc } from '../services/text.ts';
import { formatINR } from '../services/pricing.ts';
import { SYMPOSIUM_UPI_ID, SYMPOSIUM_UPI_QR } from '../data/payment.ts';

const label=(s:string)=>s.replace(/_/g,' ').toUpperCase();
const openExtra = new Set<string>();
export function renderAdditionalAbstracts(entry:roundTwo.RoundTwoEntry):string {
  // First abstract and payment must be submitted before another is accepted.
  if(!entry.round_two_attempts.length)return '';
  const list=extra.extraAbstractsFor(entry.id);
  const file=extra.extraAbstractFile(entry.id);
  const proof=extra.extraPaymentFile(entry.id);
  return `<section class="r2-extras" aria-label="Additional abstracts">
    <div class="r2-extras-heading"><span>ADDITIONAL ABSTRACTS</span><span>${list.length} SUBMITTED</span></div>
    ${list.length?`<div class="r2-extra-list">${list.map((a,i)=>`<div class="r2-extra-item">
      <div><span class="r2-extra-index">ABSTRACT ${i+2}</span>${kind==='payment' ? `<button type="button" class="action-link-cyan" data-r2-file="${esc(a.payment_path)}" data-r2-kind="payment">VIEW NEW PAYMENT PROOF</button>` : `<button type="button" class="action-link-cyan" data-r2-file="${esc(a.abstract_path)}" data-r2-kind="abstract">${esc(a.abstract_name)}</button>`}
      <small>${esc(new Date(a.submitted_at).toLocaleDateString('en-IN'))}</small></div>
      <span class="r2-extra-status" data-status="${a.status}">ABSTRACT: ${label(a.status)} · PAYMENT: ${label(a.payment_status)}</span>
      ${a.review_reason?`<p class="reg-error-line">${esc(a.review_reason)}</p>`:''}
    </div>`).join('')}</div>`:'<p class="r2-extra-hint">Your first abstract remains on record. You can add more ideas under the same registration.</p>'}
    <details class="r2-extra-add" data-r2-extra-details="${entry.id}" ${openExtra.has(entry.id)?'open':''}><summary>+ UPLOAD ANOTHER ABSTRACT</summary>
      <form data-r2-extra-submit="${entry.id}" data-r2-extra-user="${entry.user_id}">
        <div class="r2-payment">
          <div class="r2-pay-line"><span>NEW ABSTRACT FEE · <strong>${formatINR(entry.fee)}</strong></span>
          <a class="action-link-cyan" href="upi://pay?pa=${encodeURIComponent(SYMPOSIUM_UPI_ID)}&am=${entry.fee}&cu=INR&tn=${encodeURIComponent('STRIATUM EXTRA ABSTRACT '+entry.id.slice(0,8))}">PAY ${formatINR(entry.fee)} VIA UPI ↗</a></div>
          <details class="r2-payment-details"><summary>Payment QR and reference</summary>
            <img class="r2-qr" src="${SYMPOSIUM_UPI_QR}" alt="STRIATUM payment QR" />
            <p>Include ${entry.id.slice(0,8).toUpperCase()} and "additional abstract" in the payment note.</p>
          </details>
          <p class="r2-payment-note">Each additional abstract requires a NEW payment. Never reuse your previous payment proof.</p>
        </div>
        <label class="input-field-label" for="r2-extra-proof-${entry.id}">NEW PAYMENT PROOF <span>JPG, PNG or PDF · 5 MB</span></label>
        <input id="r2-extra-proof-${entry.id}" type="file" name="extra_payment" accept=".jpg,.jpeg,.png,.pdf" ${extra.extraAbstractBusy(entry.id)?'disabled':''}/>
        <p class="r2-file-name">${proof?`Selected: ${esc(proof.name)}`:'Select the NEW payment screenshot'}</p>
        <label class="input-field-label" for="r2-extra-${entry.id}">NEW ABSTRACT <span>PDF, Word or PowerPoint · 10 MB</span></label>
        <input id="r2-extra-${entry.id}" type="file" name="extra_abstract" accept=".pdf,.doc,.docx,.ppt,.pptx" ${extra.extraAbstractBusy(entry.id)?'disabled':''}/>
        <p class="r2-file-name">${file?`Selected: ${esc(file.name)}`:'Choose a separate abstract file'}</p>
        <p class="reg-error-line" role="alert">${esc(extra.extraAbstractError(entry.id))}</p>
        <button class="btn-chamfer-primary" type="submit" ${!file||!proof||extra.extraAbstractBusy(entry.id)?'disabled':''}>${extra.extraAbstractBusy(entry.id)?'UPLOADING…':'SUBMIT ADDITIONAL ABSTRACT →'}</button>
        <p class="r2-extra-hint">A separate fee and payment proof are required for each additional abstract. Both payment and abstract will be reviewed.</p>
      </form>
    </details>
  </section>`;
}
export function renderAdminAdditionalAbstracts(entry:roundTwo.RoundTwoEntry,kind:'payment'|'submission'):string{
  const list=extra.extraAbstractsFor(entry.id);
  if(!list.length)return '';
  return `<section class="r2-extras r2-extras--admin" aria-label="Additional abstracts for review">
    <div class="r2-extras-heading"><span>ADDITIONAL ABSTRACTS</span><span>${list.length}</span></div>
    ${list.map((a,i)=>`<div class="r2-extra-item">
      <div><span class="r2-extra-index">ADDITIONAL ABSTRACT ${i+1} · ${formatINR(a.fee)}</span>
      ${kind==='payment' ? `<button type="button" class="action-link-cyan" data-r2-file="${esc(a.payment_path)}" data-r2-kind="payment">VIEW NEW PAYMENT PROOF</button>` : `<button type="button" class="action-link-cyan" data-r2-file="${esc(a.abstract_path)}" data-r2-kind="abstract">${esc(a.abstract_name)}</button>`}
      <small>${esc(new Date(a.submitted_at).toLocaleString('en-IN'))}</small></div>
      <span class="r2-extra-status" data-status="${kind==='payment'?a.payment_status:a.status}">${kind==='payment'?'PAYMENT: '+label(a.payment_status):'ABSTRACT: '+label(a.status)}</span>
      ${(kind==='payment'?a.payment_status:a.status)==='under_review'?`<form data-r2-extra-review="${a.id}" data-r2-extra-kind="${kind}">
        <label class="input-field-label" for="extra-reason-${a.id}">Reason if requesting correction</label>
        <textarea id="extra-reason-${a.id}" name="reason" maxlength="2000">${esc(extra.extraReviewReason(a.id+':'+kind))}</textarea>
        <p class="reg-error-line" role="alert">${esc(extra.extraAbstractError(a.id))}</p>
        <div class="admin-action-row"><button type="submit" name="decision" value="approve" class="btn-chamfer-primary" ${extra.extraAbstractBusy(a.id)?'disabled':''}>APPROVE</button>
        <button type="submit" name="decision" value="reject" class="btn-chamfer-dark" ${extra.extraAbstractBusy(a.id)?'disabled':''}>REQUEST CORRECTION</button></div>
      </form>`:`<p class="r2-extra-hint">${esc((kind==='payment'?a.payment_reason:a.review_reason)??'Review complete')}</p>`}
    </div>`).join('')}
  </section>`;
}
export function attachAdditionalAbstracts():void{
  document.querySelectorAll<HTMLInputElement>('[name="extra_payment"]').forEach(input=>input.addEventListener('change',async()=>{
    const id=input.closest<HTMLFormElement>('form')?.dataset.r2ExtraSubmit;
    if(!id)return;
    try{await extra.selectExtraPayment(id,input.files?.[0]);}
    catch(e){appStore.showToast(e instanceof Error?e.message:'Unable to read payment proof.');}
    appStore.refresh();
  }));
  document.querySelectorAll<HTMLDetailsElement>('[data-r2-extra-details]').forEach(details=>details.addEventListener('toggle',()=>{
    const id=details.dataset.r2ExtraDetails!;
    if(details.open)openExtra.add(id);else openExtra.delete(id);
  }));
  document.querySelectorAll<HTMLInputElement>('[name="extra_abstract"]').forEach(input=>input.addEventListener('change',async()=>{
    const id=input.closest<HTMLFormElement>('form')?.dataset.r2ExtraSubmit;
    if(!id)return;
    try{await extra.selectExtraAbstract(id,input.files?.[0]);}
    catch(e){appStore.showToast(e instanceof Error?e.message:'Unable to read abstract.');}
    appStore.refresh();
  }));
  document.querySelectorAll<HTMLFormElement>('[data-r2-extra-submit]').forEach(form=>form.addEventListener('submit',async e=>{
    e.preventDefault();
    const id=form.dataset.r2ExtraSubmit!,uid=form.dataset.r2ExtraUser!;
    if(extra.extraAbstractBusy(id))return;
    try{await extra.submitExtraAbstract(id,uid);openExtra.delete(id);appStore.showToast('Additional abstract submitted for review.');}
    catch(e){appStore.showToast(e instanceof Error?e.message:'Upload failed.');}
    appStore.refresh();
  }));
  document.querySelectorAll<HTMLFormElement>('[data-r2-extra-review]').forEach(form=>{
    const id=form.dataset.r2ExtraReview!;
    form.querySelector<HTMLTextAreaElement>('textarea')?.addEventListener('input',e=>extra.setExtraReviewReason(id+':'+form.dataset.r2ExtraKind,(e.target as HTMLTextAreaElement).value));
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(extra.extraAbstractBusy(id))return;
      const approve=(e as SubmitEvent).submitter?.getAttribute('value')==='approve';
      const reason=form.querySelector<HTMLTextAreaElement>('textarea')?.value.trim()??'';
      if(!approve&&!reason){appStore.showToast('Enter a reason for rejection.');return;}
      try{if(form.dataset.r2ExtraKind==='payment')await extra.reviewExtraPayment(id,approve,reason);else await extra.reviewExtraAbstract(id,approve,reason);appStore.showToast('Additional review saved.');}
      catch(e){appStore.showToast(e instanceof Error?e.message:'Review failed.');}
      appStore.refresh();
    });
  });
}
