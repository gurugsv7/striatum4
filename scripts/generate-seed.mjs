/**
 * Generates supabase/seed/events_seed.sql from src/data/events.ts.
 *
 * The brochure data has exactly one source of truth — the TypeScript catalogue.
 * This script projects it into SQL so the database cannot drift from what the
 * app displays. Re-run it whenever the event data changes:
 *
 *   node scripts/generate-seed.mjs
 */
import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const bundle = await build({
  entryPoints: [resolve(root, 'src/data/events.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false
});

const dataUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].text).toString('base64');
const { EVENTS } = await import(dataUrl);

const q = v =>
  v === undefined || v === null || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const n = v => (v === undefined || v === null ? 'null' : String(v));
const arr = v =>
  !v || !v.length ? `'{}'` : `array[${v.map(s => q(s)).join(', ')}]`;

/** Card context line, mirroring eventContextLine() in the app. */
const contextOf = e => (e.specialties[0] ? `${e.specialties[0]} · ${e.format}` : e.format);

const rows = EVENTS.map(e => {
  const p = e.pricing ?? {};
  return `  (${[
    q(e.id),
    q(e.code),
    q(e.name),
    q(e.category),
    q(e.format),
    arr(e.specialties),
    q(e.isoDate),
    q(e.startTime),
    q(e.endTime),
    q(e.venue),
    n(e.slots),
    q(e.participation),
    n(e.teamSize?.min),
    n(e.teamSize?.max),
    n(p.earlyBird),
    n(p.lateBird),
    n(p.entry),
    n(p.spot),
    n(p.individual),
    n(p.team),
    n(p.flat),
    q(p.unit),
    p.unspecified ? 'true' : 'false',
    q(e.delegatePassRequirement),
    q(e.status),
    e.registerable ? 'true' : 'false'
  ].join(', ')})`;
});

const sql = `-- GENERATED FILE — do not edit by hand.
-- Produced by scripts/generate-seed.mjs from src/data/events.ts
-- ${EVENTS.length} events. Every value originates in the STRIATUM 4.0 brochure
-- master data; nothing here is invented. Fields the brochure does not state are
-- null, which the app renders as "hidden" rather than "TBA".

insert into public.events (
  id, code, name, category, format, specialties,
  event_date, start_time, end_time, venue,
  slots, participation, team_min, team_max,
  price_early_bird, price_late_bird, price_entry, price_spot,
  price_individual, price_team, price_flat, price_unit, price_unspecified,
  delegate_pass_requirement, status, registerable
) values
${rows.join(',\n')}
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  format = excluded.format,
  specialties = excluded.specialties,
  event_date = excluded.event_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  venue = excluded.venue,
  slots = excluded.slots,
  participation = excluded.participation,
  team_min = excluded.team_min,
  team_max = excluded.team_max,
  price_early_bird = excluded.price_early_bird,
  price_late_bird = excluded.price_late_bird,
  price_entry = excluded.price_entry,
  price_spot = excluded.price_spot,
  price_individual = excluded.price_individual,
  price_team = excluded.price_team,
  price_flat = excluded.price_flat,
  price_unit = excluded.price_unit,
  price_unspecified = excluded.price_unspecified,
  delegate_pass_requirement = excluded.delegate_pass_requirement,
  status = excluded.status,
  registerable = excluded.registerable,
  updated_at = now();
`;

const out = resolve(root, 'supabase/seed/events_seed.sql');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, sql, 'utf8');

// Context lines are derived at render time in the app; report them so the
// generated ledger text can be eyeballed against the UI.
console.log(`Wrote ${EVENTS.length} events → supabase/seed/events_seed.sql`);
console.log('Sample:', EVENTS[6].name, '|', contextOf(EVENTS[6]));
