/**
 * Generates public/sitemap.xml and rewrites the JSON-LD <script> block inside
 * index.html (between the <!-- SEO:JSONLD:START --> / <!-- SEO:JSONLD:END -->
 * markers) from src/data/events.ts.
 *
 * Run it whenever the event data changes:
 *
 *   node scripts/generate-seo.mjs
 *
 * (There is no package.json "seo" script for this — package.json is owned by
 * someone else in this repo; run the command above directly.)
 *
 * CANONICAL DOMAIN — note the "r" right after "igmc", before "isigma". The
 * currently-live site shipped with that "r" dropped, producing a domain that
 * does not resolve. Every absolute URL emitted by this script must use the
 * constant below, character for character.
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

const subEvents = EVENTS.map(e => {
  const node = {
    '@type': 'Event',
    name: e.name,
    description: e.summary ?? e.description ?? undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: PLACE
  };

  // startDate: only when the brochure published an isoDate. Never invented.
  if (e.isoDate) {
    node.startDate = e.isoDate;
    datedCount += 1;
  }

  // offers: only when a price is published (pricing.unspecified omits it).
  const price = lowestPrice(e.pricing);
  if (price !== undefined) {
    node.offers = {
      '@type': 'Offer',
      price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: SITE_ROOT
    };
    offerCount += 1;
  }

  // maximumAttendeeCapacity: only when slots is published.
  if (typeof e.slots === 'number') {
    node.maximumAttendeeCapacity = e.slots;
    capacityCount += 1;
  }

  return node;
});

// The umbrella Event's startDate/endDate are derived — not separately stated
// in the brochure — as the earliest and latest of the 11 published sub-event
// isoDates (2026-10-15 .. 2026-10-18). Never hand-edit these independently of
// the underlying event dates.
const isoDates = EVENTS.map(e => e.isoDate).filter(Boolean).sort();
const umbrellaStart = isoDates[0];
const umbrellaEnd = isoDates[isoDates.length - 1];

const SYMPOSIUM = {
  '@type': 'Event',
  '@id': `${SITE_URL}/#event`,
  name: 'STRIATUM 4.0',
  alternateName: 'STRIATUM 4.0 Medical Symposium 2026',
  description:
    'STRIATUM 4.0, presented by SIGMA 2026 at Indira Gandhi Medical College & Research Institute (IGMCRI), Puducherry — a medical symposium with workshops, quizzes and paper presentations.',
  startDate: umbrellaStart,
  endDate: umbrellaEnd,
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

const newIndexHtml =
  indexHtml.slice(0, startIdx) + jsonLdScript + indexHtml.slice(endIdx + endMarker.length);
writeFileSync(indexPath, newIndexHtml, 'utf8');

// Sitemap — single indexable route. /admin must never appear here.
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_ROOT}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
writeFileSync(resolve(root, 'public/sitemap.xml'), sitemap, 'utf8');

console.log(`STRIATUM 4.0 SEO generation complete.`);
console.log(`  subEvents emitted: ${subEvents.length}`);
console.log(`  startDate present: ${datedCount} | omitted: ${subEvents.length - datedCount}`);
console.log(`  offers present:    ${offerCount} | omitted: ${subEvents.length - offerCount}`);
console.log(`  maximumAttendeeCapacity present: ${capacityCount}`);
console.log(`  umbrella event: ${umbrellaStart} .. ${umbrellaEnd}`);
console.log(`  wrote index.html JSON-LD block + public/sitemap.xml`);
