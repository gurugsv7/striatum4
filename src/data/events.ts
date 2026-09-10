import { SymposiumEvent, EventCategory, CATEGORY_FILTERS } from './eventTypes.ts';
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
    date: '15 OCT',
    isoDate: '2026-10-15',
    startTime: '8:30 AM',
    endTime: '12:30 PM',
    needsConfirmation: undefined
  },
  PENUMBRA: {
    date: '17 OCT',
    isoDate: '2026-10-17',
    startTime: '9:00 AM',
    endTime: '1:00 PM'
  },
  GENESIS: {
    date: '16 OCT',
    isoDate: '2026-10-16',
    startTime: '8:00 AM',
    endTime: '4:00 PM'
  },
  'GLOW CODE': {
    date: '17 OCT',
    isoDate: '2026-10-17',
    startTime: '8:30 AM',
    endTime: '4:00 PM'
  },
  VITALIS: {
    name: 'Trauma Resuscitation',
    date: '16 OCT',
    isoDate: '2026-10-16',
    startTime: '8:00 AM',
    endTime: '4:30 PM',
    needsConfirmation: undefined
  },
  PLEURALIS: {
    date: '15 OCT',
    isoDate: '2026-10-15',
    startTime: '2:00 PM',
    endTime: '5:00 PM'
  },
  RYTHMICA: {
    date: '16 OCT',
    isoDate: '2026-10-16',
    startTime: '8:00 AM',
    endTime: '1:00 PM'
  },
  'OCEANIC ODYSSEY': {
    date: '18 OCT',
    isoDate: '2026-10-18',
    reportingTime: '8:00 AM'
  },
  AQUAQUEST: {
    date: '18 OCT',
    isoDate: '2026-10-18',
    reportingTime: '8:00 AM'
  },
  GLANDSWARS: {
    date: '3 OCT',
    isoDate: '2026-10-03',
    isoEndDate: '2026-10-14',
    startTime: '6:00 PM',
    endTime: '6:45 PM',
    mode: 'hybrid'
  },
  LUMINARA: {
    date: '17 OCT',
    isoDate: '2026-10-17'
  },
  'THE DIAGNOSTIC ABYSS': {
    date: '18 OCT',
    isoDate: '2026-10-18'
  },
  'CORAL CANVAS': {
    date: '18 OCT',
    isoDate: '2026-10-18'
  },
  CHIRONEX: {
    date: '18 OCT',
    isoDate: '2026-10-18',
    submissionDeadline: '13 October 2026',
    needsConfirmation: undefined
  },
  NEURONOVA: {
    date: '18 OCT',
    isoDate: '2026-10-18',
    startTime: '9:00 AM'
  },
  'THE UNCHARTED': {
    date: '17 OCT',
    isoDate: '2026-10-17'
  },
  'LIFE REIMAGINED': {
    date: '17 OCT',
    isoDate: '2026-10-17'
  },
  BIOVERSE: {
    // Organiser supplied this directly because the brochure had no room for it.
    date: '14 OCT',
    isoDate: '2026-10-14',
    startTime: '10:00 AM'
  },
  'THE MEDICAL VAULT': {
    date: '18 OCT',
    isoDate: '2026-10-18'
  },
  'AURELIA CELESTIA': {
    date: '17 OCT',
    isoDate: '2026-10-17',
    venue: 'OAT'
  },
  MEDMAZE: {
    date: '17 OCT',
    isoDate: '2026-10-17'
  }
};

/** Exact section facts whose old brochure values would otherwise still render. */
const SECTION_FACT_OVERRIDES: Record<string, Record<string, Record<string, string>>> = {
  GLANDSWARS: {
    'QUIZ FORMAT': {
      Prelims: 'Online · 3 October 2026 · 6:00 PM – 6:45 PM · 45 questions (45 minutes)',
      Semifinals: 'Offline · 14 October 2026 · Top 12 teams qualify',
      Finals: 'Offline · 14 October 2026 · Top 6 teams qualify'
    }
  },
  CHIRONEX: {
    'IMPORTANT INFORMATION': {
      'Submission deadline': '13 October 2026',
      'PPT deadline': '13 October 2026'
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
  const override = LATEST_BROCHURE_OVERRIDES[originalName];
  if (!override) return event;

  const patched: SymposiumEvent = {
    ...event,
    ...override,
    sections: patchSections(originalName, event, override)
  };

  const legacyNames = LEGACY_SEARCH_NAMES[originalName] ?? [];
  if (legacyNames.length) {
    patched.keywords = [...new Set([...(patched.keywords ?? []), ...legacyNames])];
  }

  return patched;
}

/** All 26 named STRIATUM 4.0 activities, in official brochure order. */
export const EVENTS: SymposiumEvent[] = [...EVENTS_PART_1, ...EVENTS_PART_2].map(applyLatestBrochureData);

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
 * synonyms only — they never appear as displayed symposium facts.
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

export interface SecondaryFilters {
  specialties?: string[];
  categories?: EventCategory[];
  participation?: ('individual' | 'team')[];
  requiresDelegatePass?: boolean;
  maxPrice?: number;
  dates?: string[];
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
