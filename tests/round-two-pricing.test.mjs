import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
const bundle=await build({stdin:{contents:"export { EVENTS } from './src/data/events.ts'; export { resolvePrice } from './src/services/pricing.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {EVENTS,resolvePrice}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('catalogue and both participation choices advertise the exact Round 2 fees',()=>{
  for(const [id,solo,team] of [['s4-14',400,400],['s4-15',400,400],['s4-16',300,400],['s4-17',300,400],['s4-18',500,500],['s4-19',300,300]]) {
    const event=EVENTS.find(e=>e.id===id);
    assert.equal(resolvePrice(event,'individual').amount,solo);
    assert.equal(resolvePrice(event,'team').amount,team);
    assert.match(resolvePrice(event).basis,/Round 2/);
    assert.equal(event.abstractFirst,false);
    assert.equal(event.abstractDeadline,undefined);
    assert.doesNotMatch(JSON.stringify(event),/submission is free|payable only after|payable after abstract/i);
  }
});
