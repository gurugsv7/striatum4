import { SymposiumEvent, EventCategory, CATEGORY_FILTERS } from './eventTypes.ts';
import { EVENTS_PART_1 } from './events.part1.ts';
import { EVENTS_PART_2 } from './events.part2.ts';

/** All 26 named STRIATUM 4.0 activities, in official brochure order. */
export const EVENTS: SymposiumEvent[] = [...EVENTS_PART_1, ...EVENTS_PART_2];

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
