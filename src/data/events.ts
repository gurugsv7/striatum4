import { SymposiumEvent, CATEGORY_FILTERS, Coordinator } from './eventTypes.ts';
import { EVENTS_PART_1 } from './events.part1.ts';
import { EVENTS_PART_2 } from './events.part2.ts';

/**
 * Canonical event-data corrections from the latest STRIATUM 4.0 brochure and
 * organiser-confirmed additions that could not fit in the brochure.
 *
 * Keep these as a normalization layer so UI/components remain untouched while
 * stale facts in the split source files are safely overridden. Once the final
 * brochure data is regenerated into the source files, this layer can be folded
 * back into them.
 */
const LATEST_BROCHURE_OVERRIDES: Record<string, Partial<SymposiumEvent>> = {
  SUTUREX: {
    name: 'STITCHREEF',
    date: '29 OCT',
    isoDate: '2026-10-29',
    startTime: '8:30 AM',
    endTime: '12:30 PM',
    needsConfirmation: undefined
  },
  PENUMBRA: {
    date: '31 OCT',
    isoDate: '2026-10-31',
    startTime: '9:00 AM',
    endTime: '1:00 PM'
  },
  GENESIS: {
    date: '30 OCT',
    isoDate: '2026-10-30',
    startTime: '8:00 AM',
    endTime: '4:00 PM'
  },
  'GLOW CODE': {
    date: '31 OCT',
    isoDate: '2026-10-31',
    startTime: '8:30 AM',
    endTime: '4:00 PM'
  },
  VITALIS: {
    name: 'TRAUMA RESUSCITATION',
    date: '30 OCT',
    isoDate: '2026-10-30',
    startTime: '8:00 AM',
    endTime: '4:30 PM',
    needsConfirmation: undefined
  },
  PLEURALIS: {
    date: '29 OCT',
    isoDate: '2026-10-29',
    startTime: '2:00 PM',
    endTime: '4:30 PM'
  },
  RYTHMICA: {
    date: '30 OCT',
    isoDate: '2026-10-30',
    startTime: '8:00 AM',
    endTime: '1:00 PM'
  },
  'THE SONO EDGE': {
    date: '29 OCT',
    isoDate: '2026-10-29'
  },
  PAEDOPRAXIS: {
    date: '30 OCT',
    isoDate: '2026-10-30'
  },
  BONEFIRE: {
    date: '29 OCT',
    isoDate: '2026-10-29'
  },
  'OCEANIC ODYSSEY': {
    date: '01 NOV',
    isoDate: '2026-11-01'
  },
  AQUAQUEST: {
    date: '01 NOV',
    isoDate: '2026-11-01'
  },
  GLANDSWARS: {
    date: '28 OCT',
    isoDate: '2026-10-28'
  },
  // The schedule below is organiser-confirmed for 28 Oct–1 Nov 2026. their definitions in
  // events.part1.ts were regenerated from the latest brochure, so an override
  // would only be another place for those facts to drift.
  LUMINARA: {
    date: '31 OCT',
    isoDate: '2026-10-31'
  },
  'THE DIAGNOSTIC ABYSS': {
    date: '01 NOV',
    isoDate: '2026-11-01'
  },
  'CORAL CANVAS': {
    date: '01 NOV',
    isoDate: '2026-11-01'
  },
  CHIRONEX: {
    date: '01 NOV',
    isoDate: '2026-11-01',
    submissionDeadline: '13 October 2026',
    needsConfirmation: undefined
  },
  NEURONOVA: {
    // Afternoon session on the schedule; the old 9:00 AM start no longer
    // holds and no new time has been given.
    date: '01 NOV',
    isoDate: '2026-11-01',
    startTime: undefined
  },
  'THE UNCHARTED': {
    date: '31 OCT',
    isoDate: '2026-10-31'
  },
  'LIFE REIMAGINED': {
    date: '31 OCT',
    isoDate: '2026-10-31'
  },
  BIOVERSE: {
    // Organiser supplied this directly because the brochure had no room for it.
    date: '28 OCT',
    isoDate: '2026-10-28',
    startTime: '10:00 AM'
  },
  'THE MEDICAL VAULT': {
    date: '01 NOV',
    isoDate: '2026-11-01'
  },
  MEDMAZE: {
    date: '31 OCT',
    isoDate: '2026-10-31'
  }
};

/**
 * Event in-charges, from the organiser's assignment document.
 *
 * That document is authoritative for WHO runs an event and for their phone
 * number. It is NOT used for dates: several of its workshop dates are older
 * than the current brochure, so only the names and numbers are taken from it.
 *
 * Two corrections it makes to the previous catalogue are worth naming, because
 * both were showing the wrong people publicly:
 *   - GENESIS and PENUMBRA had their in-charges swapped.
 *   - BONEFIRE was credited to Gugan M, who has no confirmed event; the
 *     in-charge is Gunasekhar. (Gugan G, of GLOW CODE, is a different person.)
 *
 * Where the document says a number was not supplied, an existing number is kept
 * only if it belongs to a person it still lists for that event. When it
 * replaces the person, their number goes with them.
 */
const EVENT_IN_CHARGES: Record<string, Coordinator[]> = {
  'THE SONO EDGE': [
    { name: 'Sanjai S', phone: '8438835212' },
    { name: 'Sivashankar V', phone: '9025844902' }
  ],
  SUTUREX: [
    { name: 'Soniya S', phone: '8428533333' },
    { name: 'Karthikeyan T', phone: '9342393778' }
  ],
  PAEDOPRAXIS: [
    { name: 'Kiruthiga R', phone: '8903704742' },
    { name: 'Harepriya', phone: '9786349308' }
  ],
  PENUMBRA: [
    { name: 'AmudhaGeedhan M', phone: '9003788545' },
    { name: 'Jivika L', phone: '8778133951' }
  ],
  GENESIS: [
    { name: 'Keerthana S', phone: '8838904846' },
    { name: 'Harini', phone: '9487515001' }
  ],
  'GLOW CODE': [
    { name: 'Tharuna S', phone: '9626183525' },
    { name: 'Gugan G', phone: '6380952626' }
  ],
  BONEFIRE: [
    { name: 'Gunasekhar', phone: '8886986966' },
    { name: 'Rathish E S', phone: '9629592347' }
  ],
  VITALIS: [
    { name: 'Sajitha B', phone: '9790735423' },
    { name: 'Akash S', phone: '9585211633' }
  ],
  PLEURALIS: [
    { name: 'Harish Ragavendar L', phone: '9150472071' },
    { name: 'Swetha S', phone: '6380235355' }
  ],
  RYTHMICA: [
    { name: 'Pramika G', phone: '9488178553' },
    { name: 'Nyara Jacob Manly', phone: '8110005017' }
  ],
  'OCEANIC ODYSSEY': [
    { name: 'Velvizhi V', phone: '8637403376' },
    { name: 'Sushama Ghosh I', phone: '8248193259' }
  ],
  AQUAQUEST: [{ name: 'Valentina J', phone: '9150885613' }, { name: 'Sakthi S', phone: '7010787992' }],
  GLANDSWARS: [
    { name: 'Dikshaya S', phone: '9488306432' },
    { name: 'Dharani M', phone: '9384295160' }
  ],
  LUMINARA: [
    { name: 'Sameera S', phone: '7397763597' },
    { name: 'Narmadha G', phone: '9342408194' }
  ],
  'THE DIAGNOSTIC ABYSS': [
    { name: 'Lakshmisree M V', phone: '9626921275' },
    { name: 'Lakshana B', phone: '8072373433' }
  ],
  'CORAL CANVAS': [{ name: 'Neena Roshini S', phone: '7904519621' }, { name: 'Vaishnovi R C', phone: '8667485281' }],
  CHIRONEX: [{ name: 'Harikrishna R', phone: '7598388872' }, { name: 'Lavanya', phone: '7603979821' }],
  NEURONOVA: [
    { name: 'Esha Gopika', phone: '9789821884' },
    { name: 'Yuvashri', phone: '6381811767' }
  ],
  // Both were already on file with numbers; the document confirms the people.
  'THE UNCHARTED': [
    { name: 'Shanmathi S', phone: '9176680741' },
    { name: 'Pooja L', phone: '9345408760' }
  ],
  'LIFE REIMAGINED': [
    { name: 'Jenna Mariam Joji', phone: '7558022834' },
    { name: 'Shivani S M', phone: '9384720603' }
  ],
  'BEYOND THE BLUE': [
    { name: 'Adithyan M', phone: '9500207418' },
    { name: 'Shivam', phone: '9354943752' }
  ],
  BIOVERSE: [{ name: 'Vithiya Saagar S', phone: '9360984942' }, { name: 'Neduenchezhian S', phone: '9345285122' }],
  'TIDAL CUTS': [
    { name: 'Ram Viswanath Senthil', phone: '7418155363' },
    { name: 'Deepavarshini S', phone: '9487449619' }
  ],
  MEMEVERSE: [{ name: 'Krishnakumar R', phone: '9790019936' }],
  'THE MEDICAL VAULT': [
    { name: 'Priyadharshini M', phone: '9150682978' },
    { name: 'Purnimasri V', phone: '9047355582' }
  ],
  MEDMAZE: [
    { name: 'Kabila Barathi S', phone: '9042461697' },
    { name: 'Atheethi G', phone: '9944858040' }
  ]
};

/** Exact section facts whose old brochure values would otherwise still render. */
const SECTION_FACT_OVERRIDES: Record<string, Record<string, Record<string, string>>> = {
  CHIRONEX: {
    'IMPORTANT INFORMATION': {
      'Submission deadline': '13 October 2026',
      'PPT deadline': '13 October 2026'
    }
  },
  NEURONOVA: {
    'IMPORTANT INFORMATION': {
      Time: 'Afternoon session'
    }
  }
};

const LEGACY_SEARCH_NAMES: Record<string, string[]> = {
  SUTUREX: ['suturex'],
  VITALIS: ['vitalis']
};

function longDate(isoDate?: string): string | undefined {
  if (!isoDate) return undefined;
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  const monthName = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day))
  );
  return `${day} ${monthName} ${year}`;
}

function patchSections(
  originalName: string,
  event: SymposiumEvent,
  override: Partial<SymposiumEvent>
): SymposiumEvent['sections'] {
  const sections = event.sections?.map(section => {
    const explicitFacts = SECTION_FACT_OVERRIDES[originalName]?.[section.title] ?? {};
    let facts = section.facts?.map(fact => {
      if (explicitFacts[fact.label] !== undefined) {
        return { ...fact, value: explicitFacts[fact.label] };
      }

      if (section.title === 'IMPORTANT INFORMATION') {
        const pricing = override.pricing ?? event.pricing;
        const amount = fact.label === 'Early Bird' ? pricing.earlyBird
          : fact.label === 'Late Bird' ? pricing.lateBird : undefined;
        if (amount !== undefined) {
          return { ...fact, value: `₹${amount.toLocaleString('en-IN')}` };
        }
        if (fact.label.toLowerCase() === 'date' && override.isoDate) {
          return { ...fact, value: longDate(override.isoDate) ?? fact.value };
        }
        if (fact.label.toLowerCase() === 'time' && override.startTime) {
          const time = override.endTime ? `${override.startTime} – ${override.endTime}` : override.startTime;
          return { ...fact, value: time };
        }
        if (fact.label.toLowerCase() === 'reporting time' && override.reportingTime) {
          return { ...fact, value: override.reportingTime };
        }
        if (fact.label.toLowerCase() === 'venue' && override.venue) {
          return { ...fact, value: override.venue };
        }
      }

      return fact;
    });

    // Newly dated events often had no Date fact in the older brochure-derived section.
    if (section.title === 'IMPORTANT INFORMATION' && override.isoDate) {
      facts = facts ?? [];
      if (!facts.some(f => f.label.toLowerCase() === 'date')) {
        const value = longDate(override.isoDate);
        if (value) facts = [{ label: 'Date', value }, ...facts];
      }
    }

    if (section.title === 'IMPORTANT INFORMATION' && override.startTime) {
      facts = facts ?? [];
      if (!facts.some(f => f.label.toLowerCase() === 'time')) {
        const value = override.endTime ? `${override.startTime} – ${override.endTime}` : override.startTime;
        facts = [...facts, { label: 'Time', value }];
      }
    }

    if (section.title === 'IMPORTANT INFORMATION' && override.venue) {
      facts = facts ?? [];
      if (!facts.some(f => f.label.toLowerCase() === 'venue')) {
        facts = [...facts, { label: 'Venue', value: override.venue }];
      }
    }

    return facts ? { ...section, facts } : section;
  });

  return sections;
}

function applyLatestBrochureData(event: SymposiumEvent): SymposiumEvent {
  const originalName = event.name;
  const inCharges = EVENT_IN_CHARGES[originalName];
  const override = LATEST_BROCHURE_OVERRIDES[originalName];

  // In-charges are keyed on the original name so renamed events still resolve,
  // and they apply whether or not the event has a brochure override.
  if (!override) return { ...event, coordinators: inCharges ?? event.coordinators,
    sections: patchSections(originalName, event, {}) };

  const patched: SymposiumEvent = {
    ...event,
    ...override,
    coordinators: inCharges ?? override.coordinators ?? event.coordinators,
    sections: patchSections(originalName, event, override)
  };

  const legacyNames = LEGACY_SEARCH_NAMES[originalName] ?? [];
  if (legacyNames.length) {
    patched.keywords = [...new Set([...(patched.keywords ?? []), ...legacyNames])];
  }

  return patched;
}

/**
 * Final 18 Oct 2026 brochure cross-check.
 * Intentionally applied after legacy brochure overrides, without rewriting historical
 * source files. The production SQL migration must be reviewed/applied separately.
 *
 * Exceptions requiring organiser confirmation: STITCHREEF has 75 seats as
 * directly instructed (printed brochure still says 50); NEURONOVA's itinerary
 * says afternoon while its event page says 9 AM, so its start time stays unset.
 */
const FINAL_BROCHURE_UPDATES: Record<string, Partial<SymposiumEvent>> = {
  's4-02': { slots: 75 },
  's4-09': { slots: 30 },
  's4-13': { startTime: undefined, endTime: undefined }, // 6 PM is for the 18 Oct ONLINE prelim, not the 28 Oct onsite rounds
  's4-14': {
    abstractDeadline: '22 October 2026',
    specialties: ['General Medicine', 'General Surgery', 'Physiology', 'Pathology', 'Ophthalmology']
  },
  's4-15': {
    abstractDeadline: '22 October 2026',
    submissionDeadline: '30 October 2026',
    specialties: ['Medicine', 'Paediatrics', 'ENT', 'Ophthalmology', 'Surgery']
  },
  's4-16': { abstractDeadline: '22 October 2026', submissionDeadline: '22 October 2026' },
  's4-17': { abstractDeadline: '23 October 2026', submissionDeadline: '30 October 2026' },
  's4-18': { abstractDeadline: '23 October 2026', teamSize: { min: 1, max: 4 } },
  's4-19': { abstractDeadline: '23 October 2026' },
  's4-21': { submissionDeadline: '26 October 2026' },
  's4-23': { submissionDeadline: '26 October 2026' },
  's4-24': { submissionDeadline: '26 October 2026' }
};

/** Old values embedded in collapsible sections are not repaired by top-level overrides. */
const FINAL_BROCHURE_TEXT: Record<string, [string, string][]> = {
  's4-11': [
    ['18 October 2026', '1 November 2026'],
    ['third-year (2024)', 'third-year (2023)'],
    ['third-year student from the 2024 batch', 'third-year student from the 2023 batch'],
    ['Only two second-year students are allowed per team.', '']
  ],
  's4-12': [
    ['18 October 2026', '1 November 2026'],
    ['Only one final-year student from the 2022 batch is allowed per team.', 'Up to two final-year students from the 2022 batch are allowed per team.'],
    ['Exactly 3 members', '1–3 members']
  ],
  's4-02': [['Limited to 50 participants.', 'Limited to 75 participants.']],
  's4-09': [['Limited to 40 participants.', 'Limited to 30 participants.']],
  's4-13': [['3 October 2026', '18 October 2026']],
  's4-14': [
    ['3 October 2026', '22 October 2026'],
    ['CRRIs (2022 batch)', 'CRRIs (2021 batch)'],
    ['Duration: 10–15 minutes including Q&A.', 'Presentation: 20 minutes followed by 5 minutes of interaction.'],
    ['General Medicine, Obstetrics & Gynaecology, Ophthalmology, Biochemistry, Physiology and Pathology', 'General Medicine, General Surgery, Physiology, Pathology and Ophthalmology']
  ],
  's4-15': [
    ['3 October 2026', '22 October 2026'],
    ['10 October 2026', '30 October 2026'],
    ['Medicine, Obstetrics & Gynaecology, Paediatrics and Surgery', 'Medicine, Paediatrics, ENT, Ophthalmology and Surgery'],
    ['Obstetrics & Gynaecology', 'ENT and Ophthalmology']
  ],
  's4-16': [['3 October 2026', '22 October 2026'], ['10 October 2026', '22 October 2026']],
  's4-17': [['2 October 2026', '23 October 2026'], ['13 October 2026', '30 October 2026']],
  's4-18': [
    ['3 October 2026', '23 October 2026'],
    ['Top 10 abstracts are selected for oral presentation.', 'Selected abstracts are invited for oral presentation.'],
    ['1–3', '1–4'],
    ['9:00 AM', 'Time to be confirmed (brochure has conflicting timings)']
  ],
  's4-19': [['3 October 2026', '23 October 2026']],
  's4-21': [['5 October 2026', '26 October 2026']],
  's4-23': [['2 October 2026', '26 October 2026']],
  's4-24': [['2 October 2026', '26 October 2026']]
};

function applyFinalBrochureReview(event: SymposiumEvent): SymposiumEvent {
  const updates = FINAL_BROCHURE_UPDATES[event.id] ?? {};
  const patches = FINAL_BROCHURE_TEXT[event.id] ?? [];
  const fix = (v: string): string => patches.reduce((value, [before, after]) => value.split(before).join(after), v);
  const fixSection = (section: NonNullable<SymposiumEvent['sections']>[number]) => ({
    ...section,
    body: section.body === undefined ? undefined : fix(section.body),
    items: section.items?.map(fix).filter(Boolean),
    facts: section.facts?.map(fact => ({
      ...fact,
      value: fact.label.toLowerCase() === 'slots' && updates.slots !== undefined
        ? String(updates.slots)
        : fix(fact.value)
    }))
  });
  return {
    ...event,
    ...updates,
    description: event.description ? fix(event.description) : undefined,
    eligibility: event.eligibility?.map(fix).filter(Boolean),
    rules: event.rules?.map(fix),
    submissionInstructions: event.submissionInstructions?.map(fix),
    sections: event.sections?.map(fixSection)
  };
}

/** All 26 named STRIATUM 4.0 activities, in official brochure order. */
export const EVENTS: SymposiumEvent[] = [...EVENTS_PART_1, ...EVENTS_PART_2]
  .map(applyLatestBrochureData)
  .map(applyFinalBrochureReview);

const BY_ID = new Map(EVENTS.map(e => [e.id, e]));

export function getEvent(id: string): SymposiumEvent | undefined {
  return BY_ID.get(id);
}

export function requireEvent(id: string): SymposiumEvent {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown event: ${id}`);
  return found;
}

/** Secondary context line for cards, e.g. "Orthopaedics · Workshop". */
export function eventContextLine(event: SymposiumEvent): string {
  const specialty = event.specialties[0];
  return specialty ? `${specialty} · ${event.format}` : event.format;
}

export function matchesCategoryFilter(event: SymposiumEvent, filterId: string): boolean {
  if (filterId === 'ALL') return true;
  const filter = CATEGORY_FILTERS.find(f => f.id === filterId);
  if (!filter) return true;
  return filter.categories.includes(event.category);
}

/** Search corpus: name + specialty + topic + format + keywords + coordinators. */
function corpusFor(event: SymposiumEvent): string {
  return [
    event.name,
    event.code,
    event.tagline ?? '',
    event.summary ?? '',
    event.description ?? '',
    event.format,
    event.category,
    event.specialties.join(' '),
    (event.keywords ?? []).join(' '),
    (event.skills ?? []).join(' '),
    (event.coordinators ?? []).map(c => c.name).join(' ')
  ]
    .join(' ')
    .toLowerCase();
}

const CORPUS = new Map(EVENTS.map(e => [e.id, corpusFor(e)]));

/**
 * Query aliases for the abbreviations students actually type. These are search
 * synonyms only — they never appear as displayed conclave facts.
 */
const ALIASES: Record<string, string[]> = {
  ortho: ['orthopaedic', 'bone', 'fracture', 'cast', 'tendon'],
  bone: ['orthopaedic', 'fracture', 'cast'],
  surg: ['surgery', 'surgical', 'suturing', 'suture'],
  suture: ['surgery', 'surgical', 'suturing'],
  peds: ['paediatric', 'paediatrics', 'child', 'neonatal'],
  ped: ['paediatric', 'paediatrics', 'child', 'neonatal'],
  paeds: ['paediatric', 'paediatrics', 'child', 'neonatal'],
  obg: ['obstetric', 'obstetrics', 'gynaecology', 'labour'],
  obgyn: ['obstetric', 'obstetrics', 'gynaecology', 'labour'],
  gynae: ['gynaecology', 'obstetrics'],
  cardio: ['ecg', 'cardiac', 'heart', 'rhythm'],
  ecg: ['ecg', 'cardiac', 'heart', 'rhythm'],
  ekg: ['ecg', 'cardiac', 'heart'],
  heart: ['ecg', 'cardiac', 'rhythm'],
  usg: ['ultrasound', 'sonography', 'pocus', 'e-fast'],
  sono: ['ultrasound', 'sonography', 'pocus'],
  pocus: ['ultrasound', 'sonography'],
  rads: ['radiology', 'imaging', 'ultrasound'],
  radio: ['radiology', 'imaging'],
  er: ['emergency', 'trauma', 'resuscitation'],
  icu: ['critical care', 'emergency', 'resuscitation'],
  trauma: ['emergency', 'resuscitation', 'splint'],
  resp: ['respiratory', 'pleural', 'thoracocentesis', 'pneumothorax'],
  pulmo: ['respiratory', 'pleural', 'thoracocentesis'],
  lung: ['respiratory', 'pleural', 'pneumothorax'],
  chest: ['respiratory', 'pleural'],
  nephro: ['nephrology', 'renal', 'kidney'],
  renal: ['nephrology', 'kidney'],
  kidney: ['nephrology', 'renal'],
  endo: ['endocrinology', 'gland', 'hormone', 'thyroid'],
  eye: ['ophthalmology'],
  ophthal: ['ophthalmology'],
  ai: ['artificial intelligence', 'machine learning', 'research'],
  paper: ['paper presentation', 'abstract', 'research'],
  poster: ['poster presentation', 'eposter'],
  "case": ['case presentation'],
  quiz: ['quiz'],
  art: ['art', 'drawing', 'painting', 'creative'],
  film: ['short film', 'video'],
  reel: ['reel', 'video'],
  meme: ['meme'],
  escape: ['mystery room', 'puzzle'],
  hunt: ['treasure hunt', 'clues']
};

export function matchesSearch(event: SymposiumEvent, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  const corpus = CORPUS.get(event.id) ?? '';

  const matchToken = (token: string): boolean => {
    if (!token) return true;
    if (corpus.includes(token)) return true;
    const synonyms = ALIASES[token];
    return Boolean(synonyms && synonyms.some(s => corpus.includes(s)));
  };

  if (corpus.includes(query)) return true;

  const tokens = query.split(/\s+/).filter(Boolean);
  return tokens.every(matchToken);
}

/** Every specialty tag present across the catalogue, alphabetised. */
export function allSpecialties(): string[] {
  const set = new Set<string>();
  EVENTS.forEach(e => e.specialties.forEach(s => set.add(s)));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Every stated event date, in calendar order (events without a date are excluded). */
export function allEventDates(): { iso: string; display: string }[] {
  const map = new Map<string, string>();
  EVENTS.forEach(e => {
    if (e.isoDate && e.date) map.set(e.isoDate, e.date);
  });
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([iso, display]) => ({ iso, display }));
}
