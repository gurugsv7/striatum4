import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

async function importBundle(options) {
  const result = await build({ bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent', ...options });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const proofs = await importBundle({ entryPoints: ['src/components/AdminProofs.ts'] });

class Element {
  constructor(dataset = {}) { this.dataset = dataset; this.children = []; this.isConnected = true; }
  querySelector(selector) { return this.children.find(child => '.' + child.className === selector) ?? null; }
  replaceChildren(...children) { this.children = children; }
  getAttribute(name) { return this[name] ?? null; }
}
function slot(kind, key) { return new Element({ adminProofKind: kind, adminProofKey: key, adminProofAlt: 'Synthetic evidence' }); }
let observers = [];
class Observer {
  constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); observers.push(this); }
  observe(target) { this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
  disconnect() { this.disconnected = true; this.targets.clear(); }
  emit(target, isIntersecting = true) { this.callback([{ target, isIntersecting }]); }
}
globalThis.document = { createElement: () => new Element() };
globalThis.IntersectionObserver = Observer;

await test('near-visible proofs update only their slots, preserving form and scroller identity', () => {
  const first = slot('order', 'one'), duplicate = slot('order', 'one'), distant = slot('path', 'two');
  const root = { scrollTop: 1234, input: { value: 'Reason being typed' }, querySelectorAll: () => [first, duplicate, distant] };
  const calls = [];
  proofs.attachAdminProofs(root, { order: key => { calls.push(key); return null; }, path: key => { calls.push(key); return null; } });
  const observer = observers.at(-1);
  assert.equal(observer.options.root, root);
  assert.equal(observer.options.rootMargin, '600px 0px');
  assert.deepEqual(calls, []);
  observer.emit(first, false);
  assert.deepEqual(calls, []);
  observer.emit(first);
  assert.deepEqual(calls, ['one']);
  assert.equal(observer.targets.has(first), true, 'pending/failed requests remain eligible for re-entry');
  proofs.updateAdminProof({ kind: 'order', key: 'one', url: 'https://example.test/proof-1' });
  assert.equal(first.children[0].src, 'https://example.test/proof-1');
  assert.equal(observer.targets.has(first), false, 'successful proofs stop being observed');
  assert.equal(duplicate.children[0].src, 'https://example.test/proof-1');
  assert.equal(first.children[0].loading, 'lazy');
  assert.equal(first.children[0].decoding, 'async');
  assert.equal(distant.children.length, 0);
  assert.equal(root.scrollTop, 1234);
  assert.equal(root.input.value, 'Reason being typed');
  const image = first.children[0];
  proofs.updateAdminProof({ kind: 'order', key: 'one', url: 'https://example.test/renewed' });
  assert.equal(first.children[0], image);
  assert.equal(image.src, 'https://example.test/renewed');
  proofs.detachAdminProofs();
  observer.emit(distant);
  assert.deepEqual(calls, ['one'], 'queued observer callbacks cannot load a departed page');
  proofs.updateAdminProof({ kind: 'order', key: 'one', url: 'https://example.test/late' });
  assert.equal(image.src, 'https://example.test/renewed');
});

await test('a failed or pending proof remains retryable after leaving and re-entering the viewport', () => {
  const pending = slot('order', 'retry'); let attempts = 0;
  proofs.attachAdminProofs({ querySelectorAll: () => [pending] }, {
    order: () => { attempts++; return null; }, path: () => null
  });
  const observer = observers.at(-1);
  observer.emit(pending); observer.emit(pending, false); observer.emit(pending);
  assert.equal(attempts, 2);
  assert.equal(observer.targets.has(pending), true);
  proofs.updateAdminProof({kind:'order', key:'retry', url:'https://example.test/retry'});
  assert.equal(observer.targets.has(pending), false);
  proofs.detachAdminProofs();
});

await test('fallback, missing keys, cached links and remounts remain usable', () => {
  delete globalThis.IntersectionObserver;
  const image = slot('order', 'cached'), missing = slot('path', '');
  const abstract = slot('path', 'abstract');
  abstract.dataset.adminProofFormat = 'link'; abstract.dataset.adminProofName = 'Synthetic <abstract>';
  const pending = new Element(); pending.className = 'admin-abstract-pending';
  pending.replaceWith = link => { abstract.children = [link]; };
  abstract.children = [pending];
  const calls = [];
  proofs.attachAdminProofs({ querySelectorAll: () => [image, missing, abstract] }, {
    order: key => { calls.push(key); return 'https://example.test/image'; },
    path: key => { calls.push(key); return 'https://example.test/abstract'; }
  });
  assert.deepEqual(calls, ['cached', 'abstract']);
  assert.equal(abstract.children[0].href, 'https://example.test/abstract');
  assert.equal(abstract.children[0].textContent, 'Synthetic <abstract> ↓');
  assert.equal(abstract.children[0].rel, 'noopener noreferrer');
  proofs.detachAdminProofs();
  globalThis.IntersectionObserver = Observer;
  proofs.attachAdminProofs({ querySelectorAll: () => [image] }, { order: () => null, path: () => null });
  assert.equal(observers.at(-1).targets.size, 1);
  proofs.detachAdminProofs();
});

await test('proof markup escapes content, reserves its own slot and lazy-decodes images', () => {
  const html = proofs.renderAdminProofImage('path', 'a"b', 'https://example.test/?x="', '<Evidence>', 'Loading');
  assert.match(html, /admin-proof-content/);
  assert.match(html, /loading="lazy" decoding="async"/);
  assert.match(html, /a&amp;quot;b|a&quot;b/);
  assert.match(html, /&lt;Evidence&gt;/);
});

const serviceSource = await readFile('src/services/registrationService.ts', 'utf8');
const remoteNames = [...new Set([...serviceSource.matchAll(/remote\.([a-z][a-zA-Z0-9]*)/g)].map(match => match[1]))].filter(name => name !== 'ts');
const snapshot = {
  orders: [{ id: 'synthetic-order', reference: 'SYNTHETIC-1', userId: 'fixture', lines: [], subtotal: 1, discountAmount: 0, total: 1, status: 'under_review', createdAt: 1, proofPath: 'fixture/order.png' }],
  registrations: [], delegate: null, allDelegates: [], participants: [], capacities: {}, isAdmin: true, isFinanceAdmin: true, eventIds: [], eventAdminRegistrations: []
};
globalThis.__proofFixture = { calls: [], deferred: new Map(), snapshot };
const service = await importBundle({ entryPoints: ['src/services/registrationService.ts'], plugins: [{
  name: 'isolate-network', setup(build) {
    build.onResolve({ filter: /\/(remote|authService|supabaseClient|roundTwoService)\.ts$/ }, args => ({ path: args.path, namespace: 'mock' }));
    build.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: args.path.endsWith('/roundTwoService.ts') ? 'export async function loadRoundTwo(){}'
      : args.path.endsWith('/remote.ts')
      ? remoteNames.map(name => name === 'getProofUrl'
        ? `export async function getProofUrl(path) { const f=globalThis.__proofFixture; f.calls.push(path); return new Promise((resolve,reject)=>f.deferred.set(path,{resolve,reject})); }`
        : name === 'fetchSnapshot' ? `export async function fetchSnapshot(){ return globalThis.__proofFixture.snapshot; }`
        : name === 'expireStaleOrders' ? `export async function expireStaleOrders(){}`
        : `export async function ${name}(){ throw new Error('Unexpected mutation: ${name}'); }`).join('\n')
      : args.path.endsWith('/authService.ts') ? `export function getCurrentUser(){return {id:'fixture'};}`
      : `export function isSupabaseConfigured(){return true;}` }));
  }
}] });
const tick = () => new Promise(resolve => setImmediate(resolve));
await test('real service emits proof-only updates, deduplicates signing, retries failures and renews expiry', async () => {
  await service.hydrate();
  let dataUpdates = 0; const updates = [];
  const offData = service.subscribe(() => dataUpdates++);
  const offProof = service.subscribeProofs(update => updates.push(update));
  const fixture = globalThis.__proofFixture;
  assert.equal(service.readProofImage('synthetic-order', false), null);
  assert.equal(service.readProofByPath('fixture/delegate.png', false), null);
  assert.deepEqual(fixture.calls, []);
  service.readProofImage('synthetic-order'); service.readProofImage('synthetic-order');
  assert.deepEqual(fixture.calls, ['fixture/order.png']);
  fixture.deferred.get('fixture/order.png').resolve('https://example.test/order'); await tick();
  assert.equal(dataUpdates, 0);
  assert.deepEqual(updates, [{kind:'order', key:'synthetic-order', url:'https://example.test/order'}]);
  assert.equal(service.readProofImage('synthetic-order'), 'https://example.test/order');
  assert.equal(fixture.calls.length, 1);
  service.readProofByPath('fixture/delegate.png'); service.readProofByPath('fixture/delegate.png');
  fixture.deferred.get('fixture/delegate.png').reject(new Error('synthetic network failure')); await tick();
  service.readProofByPath('fixture/delegate.png');
  assert.equal(fixture.calls.filter(path => path === 'fixture/delegate.png').length, 2);
  fixture.deferred.get('fixture/delegate.png').resolve('https://example.test/delegate'); await tick();
  assert.equal(updates.at(-1).kind, 'path');
  assert.equal(dataUpdates, 0);
  const now = Date.now;
  try {
    Date.now = () => now() + 5 * 60 * 1000;
    assert.equal(service.readProofImage('synthetic-order', false), null);
    service.readProofImage('synthetic-order');
    fixture.deferred.get('fixture/order.png').resolve('https://example.test/renewed'); await tick();
    assert.equal(service.readProofImage('synthetic-order'), 'https://example.test/renewed');
  } finally { Date.now = now; offData(); offProof(); }
});
