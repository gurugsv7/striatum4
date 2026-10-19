import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const stored = new Map();
globalThis.localStorage = {getItem: key => stored.get(key) ?? null, setItem: (key,value) => stored.set(key,value)};
function intent(years, eventId='s4-11') {
  return {eventId, teams:[{teamIndex:1, teamCollege:'Test College', participants:years.map((year,i)=>({
    position:i+1,role:i===0?'captain':'member',name:`Synthetic ${i}`,year,
    college:'Test College',phone:'9999999999',email:'synthetic@example.test'
  }))}]};
}
const invalid = intent(['2023','2023','2024']);
stored.set('striatum4.registration.v1',JSON.stringify({version:1,cart:[{eventId:'s4-11',participation:'team',addedAt:1,intent:invalid}],delegate:{status:'approved'}}));
const bundled=await build({stdin:{contents:`export * from './src/services/registrationForm.ts'; export {priceCart,createOrder,replaceRegistration} from './src/services/registrationService.ts';`,resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));

test('all 27 junior batch combinations follow the 2023 cap',()=>{
  for(const a of ['2023','2024','2025']) for(const b of ['2023','2024','2025']) for(const c of ['2023','2024','2025']) {
    const years=[a,b,c];
    assert.equal(api.validateIntent(intent(years)).ok,years.filter(y=>y==='2023').length<=1,years.join(','));
  }
});
test('all 125 senior batch combinations follow the 2021 and 2022 caps',()=>{
  for(const a of ['2021','2022','2023','2024','2025']) for(const b of ['2021','2022','2023','2024','2025']) for(const c of ['2021','2022','2023','2024','2025']) {
    const years=[a,b,c];
    assert.equal(api.validateIntent(intent(years,'s4-12')).ok,years.filter(y=>y==='2021').length<=1 && years.filter(y=>y==='2022').length<=2,years.join(','));
  }
});
test('missing batches, ineligible batches, empty teams and wrong sizes fail',()=>{
  for(const years of [['','2024','2025'],['2022','2024','2025'],[],['2024','2025']]) assert.equal(api.validateIntent(intent(years)).ok,false);
  assert.equal(api.validateIntent({eventId:'s4-11',teams:[]}).ok,false);
});
test('stale invalid carts are blocked at pricing and checkout, then become payable after editing',async()=>{
  assert(api.priceCart().blockingIssues.some(i=>i.code==='roster'));
  assert.equal((await api.createOrder()).ok,false);
  assert.equal(api.replaceRegistration(intent(['2024','2024','2025'])).ok,true);
  assert.equal(api.priceCart().blockingIssues.length,0);
  assert.equal(api.priceCart().total,600);
  const order=await api.createOrder();
  assert.equal(order.ok,true);
  assert.equal(order.order.total,600);
});
