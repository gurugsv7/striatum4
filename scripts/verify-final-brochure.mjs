/**
 * Branch-only release gate for the organiser-supplied final STRIATUM brochure.
 * Checks the effective runtime catalogue, not the stale split source files.
 * Fail loudly if a displayed fact would contradict the final brochure.
 */
import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function loadSource(path) {
  const result = await build({
    entryPoints: [path], bundle: true, platform: 'neutral', format: 'esm', write: false
  });
  const url = 'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64');
  return import(url);
}
const { EVENTS } = await loadSource('src/data/events.ts');
const { COMBO_OFFERS } = await loadSource('src/data/combos.ts');
const byId = new Map(EVENTS.map(e => [e.id, e]));
assert.equal(EVENTS.length, 26, 'Expected all 26 registered event types');
assert.equal(byId.size, 26, 'No duplicate events');

const dates = {
  '01':'2026-10-29', '02':'2026-10-29', '03':'2026-10-30',
  '04':'2026-10-31', '05':'2026-10-30', '06':'2026-10-31',
  '07':'2026-10-29', '08':'2026-10-30', '09':'2026-10-29',
  '10':'2026-10-30', '11':'2026-11-01', '12':'2026-11-01',
  '13':'2026-10-28', '14':'2026-10-31', '15':'2026-11-01',
  '16':'2026-11-01', '17':'2026-11-01', '18':'2026-11-01',
  '19':'2026-10-31', '20':'2026-10-31',
  '22':'2026-10-28', '25':'2026-11-01', '26':'2026-10-31'
};
for (const [n, date] of Object.entries(dates)) {
  assert.equal(byId.get('s4-'+n)?.isoDate, date, 'Programme date s4-'+n);
}
for (const id of ['s4-21','s4-23','s4-24']) assert.equal(byId.get(id)?.isoDate, undefined, id + ' has no published onsite date');
assert.equal(byId.get('s4-02')?.slots,75,'75 seat organiser-authorised STITCHREEF');
assert.equal(byId.get('s4-09')?.slots,30,'PLEURALIS brochure');
assert.equal(byId.get('s4-13')?.startTime,undefined,'Do not mislabel online prelim time as onsite');
assert.equal(byId.get('s4-13')?.endTime,undefined);
const deadlines = { '14':'22 October 2026', '15':'22 October 2026', '16':'22 October 2026',
  '17':'23 October 2026', '18':'23 October 2026', '19':'23 October 2026' };
for (const [n,d] of Object.entries(deadlines)) assert.equal(byId.get('s4-'+n)?.abstractDeadline,d,'Abstract date s4-'+n);
for (const n of ['21','23','24']) assert.equal(byId.get('s4-'+n)?.submissionDeadline,'26 October 2026','Creative entry deadline s4-'+n);
assert.equal(byId.get('s4-18')?.teamSize?.max,4);
const combo = COMBO_OFFERS.find(x=>x.id==='combo-genesis-stitchreef-pleuralis');
assert.ok(combo);
assert.equal(combo.publishedComboTotal,2500);
assert.equal(combo.publishedNormalTotal,2800);
const text = (e) => JSON.stringify({
  description:e.description,
  eligibility:e.eligibility,
  rules:e.rules,
  submissionInstructions:e.submissionInstructions,
  sections:e.sections
});
for(const n of ['14','15','16','17','18','19','21','23','24']) {
  const e=byId.get('s4-'+n);
  assert.ok(e);
  const str=text(e);
  assert.doesNotMatch(str,/\b(?:2|3|5|10|13) October 2026/i,'Stale October deadline in '+e.name);
}
for(const n of ['11','12']) assert.doesNotMatch(text(byId.get('s4-'+n)),/18 October 2026/, 'Legacy quiz date in details of '+n);
assert.doesNotMatch(text(byId.get('s4-13')),/3 October 2026/, 'GLANDSWARS online prelim must be 18 Oct');
assert.match(text(byId.get('s4-13')),/18 October 2026/, 'GLANDSWARS prelim must be present');
assert.match(text(byId.get('s4-11')),/2023/, 'Junior quiz correct batch');
assert.match(text(byId.get('s4-12')),/two final-year|Up to two final-year/i, 'Senior quiz correct final-year limit');
console.log('PASS: 26 event entries, 23 dated programme items, deadlines, quizzes, seats, and combo pricing');
