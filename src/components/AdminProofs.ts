import { escapeHtml } from '../services/text.ts';
import type { ProofUpdate } from '../services/registrationService.ts';

interface ProofReaders {
  order: (key: string) => string | null;
  path: (key: string) => string | null;
}

let observer: IntersectionObserver | null = null;
const slots = new Map<string, HTMLElement[]>();
const slotKey = (kind: string, key: string) => JSON.stringify([kind, key]);

/** Keep the proof frame in place while its private URL and image arrive. */
export function renderAdminProofImage(kind: ProofUpdate['kind'], key: string | undefined, url: string | null, alt: string, empty: string): string {
  return `<div class="admin-proof-content" data-admin-proof-kind="${kind}" data-admin-proof-key="${escapeHtml(key ?? '')}" data-admin-proof-alt="${escapeHtml(alt)}">
    ${url
      ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" class="admin-proof-img" loading="lazy" decoding="async" />`
      : `<div class="admin-proof-empty">${escapeHtml(empty)}</div>`}
  </div>`;
}

function updateSlot(slot: HTMLElement, url: string): void {
  if (!slot.isConnected) return;
  if (slot.dataset.adminProofFormat === 'link') {
    let link = slot.querySelector<HTMLAnchorElement>('.admin-abstract-link');
    if (!link) {
      link = document.createElement('a');
      link.className = 'admin-abstract-link';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = (slot.dataset.adminProofName ?? 'Abstract') + ' ↓';
      slot.querySelector('.admin-abstract-pending')?.replaceWith(link);
    }
    link.href = url;
    return;
  }
  let image = slot.querySelector<HTMLImageElement>('.admin-proof-img');
  if (!image) {
    image = document.createElement('img');
    image.className = 'admin-proof-img';
    image.alt = slot.dataset.adminProofAlt ?? 'Payment evidence';
    image.loading = 'lazy';
    image.decoding = 'async';
    slot.replaceChildren(image);
  }
  if (image.getAttribute('src') !== url) image.src = url;
}

/** Proof completion must not replace the scroller, forms or action buttons. */
export function updateAdminProof(update: ProofUpdate): void {
  slots.get(slotKey(update.kind, update.key))?.forEach(slot => {
    updateSlot(slot, update.url);
    observer?.unobserve(slot);
  });
}

/** Called before a route/state render so no detached page stays observed. */
export function detachAdminProofs(): void {
  observer?.disconnect();
  observer = null;
  slots.clear();
}

export function attachAdminProofs(root: HTMLElement, readers: ProofReaders): void {
  detachAdminProofs();
  const load = (slot: HTMLElement) => {
    const kind = slot.dataset.adminProofKind;
    const key = slot.dataset.adminProofKey;
    if (!key || (kind !== 'order' && kind !== 'path')) return;
    const url = readers[kind](key);
    if (url) {
      updateSlot(slot, url);
      observer?.unobserve(slot);
    }
  };
  if (typeof IntersectionObserver !== 'undefined') {
    const current = new IntersectionObserver(entries => {
      if (observer !== current) return;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        load(entry.target as HTMLElement);
      });
    }, { root, rootMargin: '600px 0px' });
    observer = current;
  }
  root.querySelectorAll<HTMLElement>('[data-admin-proof-key]').forEach(slot => {
    const kind = slot.dataset.adminProofKind;
    const key = slot.dataset.adminProofKey;
    if (!key || (kind !== 'order' && kind !== 'path')) return;
    const identity = slotKey(kind, key);
    slots.set(identity, [...(slots.get(identity) ?? []), slot]);
    if (observer) observer.observe(slot);
    else load(slot);
  });
}
