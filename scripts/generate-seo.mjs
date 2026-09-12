/**
 * Generates public/sitemap.xml and rewrites the JSON-LD <script> block inside
 * index.html (between the <!-- SEO:JSONLD:START --> / <!-- SEO:JSONLD:END -->
 * markers) from src/data/events.ts.
 *
 * Run it whenever the event data changes:
 *
 *   npm run seo
 *
 * The production build also runs this automatically, preventing event-data and
 * structured-data drift.
 *
 * CANONICAL DOMAIN — note the "r" right after "igmc", before "isigma". Every
 * absolute URL emitted by this script must use the constant below, character
 * for character.
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SITE_URL = 'https://www.igmcrisigma.com';
const SITE_ROOT = `${SITE_URL}/`;
const LOGO_URL = `${SITE_URL}/assets/caduceus_crest.png`;
const IMAGE_URL = `${SITE_URL}/assets/homepage.jpg`;

// Official conference window from the current brochure. Pre-conference rounds
// (for example GLANDSWARS prelims on 3 Oct) remain sub-events but must not move
// the symposium itself outside its published 14–18 October dates.
const CONFERENCE_START = '2026-10-14';
const CONFERENCE_END = '2026-10-18';
const CONFERENCE_DATE_COPY = '14–18 October 2026';

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

/** Lowest published price for an event, across whichever pricing fields the
 * brochure states (earlyBird/lateBird, entry/spot, individual/team, flat).
 * Returns undefined when pricing.unspecified is true or nothing is published. */
function lowestPrice(pricing) {
  if (!pricing || pricing.unspecified) return undefined;
  const candidates = [
    pricing.earlyBird,
    pricing.lateBird,
    pricing.entry,
    pricing.spot,
    pricing.individual,
    pricing.team,
    pricing.flat
  ].filter(v => typeof v === 'number');
  if (!candidates.length) return undefined;
  return Math.min(...candidates);
}

const PLACE = {
  '@type': 'Place',
  name: 'Indira Gandhi Medical College & Research Institute',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Puducherry',
    addressRegion: 'Puducherry',
    addressCountry: 'IN'
  }
};

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'IGMCRI SIGMA',
  alternateName: 'SIGMA 2026',
  url: SITE_ROOT,
  logo: LOGO_URL,
  parentOrganization: {
    '@type': 'CollegeOrUniversity',
    name: 'Indira Gandhi Medical College & Research Institute'
  }
};

const WEBSITE = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'STRIATUM 4.0',
  url: SITE_ROOT,
  inLanguage: 'en-IN',
  publisher: { '@id': `${SITE_URL}/#organization` }
};

let datedCount = 0;
let offerCount = 0;
let capacityCount = 0;

/*
 * Google requires `startDate` for Event rich results. Events without a confirmed
 * date are omitted from the Event graph rather than receiving guessed dates.
 * They keep their pages and can join the graph automatically once `isoDate` is
 * added to the canonical event data.
 *
 * `performer` and `offers.validFrom` remain absent because the organisers have
 * not supplied those facts.
 */
const undated = EVENTS.filter(e => !e.isoDate);

const subEvents = EVENTS.filter(e => e.isoDate).map(e => {
  const eventUrl = `${SITE_URL}/event/${encodeURIComponent(e.id)}`;
  const node = {
    '@type': 'Event',
    '@id': eventUrl,
    url: eventUrl,
    name: e.name,
    description: e.summary ?? e.description ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      e.mode === 'online'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : e.mode === 'hybrid'
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    location: PLACE,
    organizer: { '@id': `${SITE_URL}/#organization` },
    image: IMAGE_URL,
    startDate: e.isoDate,
    endDate: e.isoEndDate ?? e.isoDate
  };
  datedCount += 1;

  const price = lowestPrice(e.pricing);
  if (price !== undefined) {
    node.offers = {
      '@type': 'Offer',
      price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: eventUrl
    };
    offerCount += 1;
  }

  if (typeof e.slots === 'number') {
    node.maximumAttendeeCapacity = e.slots;
    capacityCount += 1;
  }

  return node;
});

const SYMPOSIUM = {
  '@type': 'Event',
  '@id': `${SITE_URL}/#event`,
  name: 'STRIATUM 4.0',
  alternateName: 'STRIATUM 4.0 Medical Symposium 2026',
  description:
    `STRIATUM 4.0, presented by SIGMA 2026 at Indira Gandhi Medical College & Research Institute (IGMCRI), Puducherry — a medical symposium with workshops, quizzes and paper presentations, ${CONFERENCE_DATE_COPY}.`,
  startDate: CONFERENCE_START,
  endDate: CONFERENCE_END,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: PLACE,
  organizer: { '@id': `${SITE_URL}/#organization` },
  image: IMAGE_URL,
  url: SITE_ROOT,
  subEvent: subEvents
};

const graph = {
  '@context': 'https://schema.org',
  '@graph': [ORGANIZATION, WEBSITE, SYMPOSIUM]
};

const jsonLdScript = `<!-- SEO:JSONLD:START -->
    <!-- Generated by scripts/generate-seo.mjs — do not hand-edit between these markers. -->
    <script type="application/ld+json">
${JSON.stringify(graph, null, 2)}
    </script>
    <!-- SEO:JSONLD:END -->`;

const indexPath = resolve(root, 'index.html');
const indexHtml = readFileSync(indexPath, 'utf8');
const startMarker = '<!-- SEO:JSONLD:START -->';
const endMarker = '<!-- SEO:JSONLD:END -->';
const startIdx = indexHtml.indexOf(startMarker);
const endIdx = indexHtml.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  throw new Error(
    'index.html is missing the SEO:JSONLD:START / SEO:JSONLD:END markers. Add them to <head> before running this script.'
  );
}

let newIndexHtml =
  indexHtml.slice(0, startIdx) + jsonLdScript + indexHtml.slice(endIdx + endMarker.length);

// Repair the three public social/search descriptions if an older generated
// index still carries the previous 15–18 Oct copy. This is intentionally exact
// so unrelated prose is never rewritten.
newIndexHtml = newIndexHtml.replaceAll('15–18 October 2026', CONFERENCE_DATE_COPY);
writeFileSync(indexPath, newIndexHtml, 'utf8');

// Sitemap. /admin and other private/transactional routes must never appear
// here. Public legal pages and all event detail routes remain indexable.
const today = new Date().toISOString().slice(0, 10);
const ROUTES = [
  { loc: SITE_ROOT, changefreq: 'weekly', priority: '1.0' },
  { loc: `${SITE_URL}/explore`, changefreq: 'weekly', priority: '0.9' },
  { loc: `${SITE_URL}/programme`, changefreq: 'weekly', priority: '0.8' },
  ...EVENTS.map(e => ({
    loc: `${SITE_URL}/event/${encodeURIComponent(e.id)}`,
    changefreq: 'weekly',
    priority: '0.8'
  })),
  { loc: `${SITE_URL}/privacy`, changefreq: 'yearly', priority: '0.3' },
  { loc: `${SITE_URL}/terms`, changefreq: 'yearly', priority: '0.3' },
  { loc: `${SITE_URL}/credits`, changefreq: 'yearly', priority: '0.3' }
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  r => `  <url>
    <loc>${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
).join('\n')}
</urlset>
`;
writeFileSync(resolve(root, 'public/sitemap.xml'), sitemap, 'utf8');

console.log(`STRIATUM 4.0 SEO generation complete.`);
console.log(`  subEvents emitted: ${subEvents.length}`);
console.log(`  dated events:       ${datedCount}`);
console.log(`  offers present:     ${offerCount}`);
console.log(`  maximumAttendeeCapacity present: ${capacityCount}`);
console.log(`  official conference: ${CONFERENCE_START} .. ${CONFERENCE_END}`);
console.log(`  sitemap URLs: ${ROUTES.length}`);
console.log(`  omitted for no confirmed date: ${undated.length}`);
undated.forEach(e => console.log(`    - ${e.name}`));
console.log(`  wrote index.html JSON-LD/meta date copy + public/sitemap.xml`);
