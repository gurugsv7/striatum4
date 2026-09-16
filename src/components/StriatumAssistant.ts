import { EVENTS, allEventDates } from '../data/events.ts';
import { CATEGORY_LABELS, EventCategory, SymposiumEvent } from '../data/eventTypes.ts';
import { DELEGATE_PASS_TIERS } from '../state/appStore.ts';
import { appStore } from '../state/appStore.ts';
import { routeFromPath } from '../services/router.ts';
import { resolvePrice, formatINR, tierLabel } from '../services/pricing.ts';
import { isFullDayWorkshop } from '../services/workshop.ts';
import { REGISTRATION_CONTACT, STRIATUM_COMMUNITY_URL, telNumber } from '../data/contacts.ts';
import '../styles/assistant.css';

import { escapeHtml as esc } from '../services/text.ts';

/**
 * The field guide.
 *
 * It is an index of the catalogue, not a language model: every answer here is
 * built from the same data the pages render, so it cannot state a fee or a date
 * that the rest of the site disagrees with.
 *
 * What it used to do badly was everything that was not an event name. "hi" was
 * discarded before it was read (tokens of two characters or fewer were dropped),
 * so the most common opening a person types got "I couldn't match that". The
 * shape below fixes that by answering intent first — greetings, fees, venue,
 * how to register, contacts — and only then falling through to a search.
 */

/* ------------------------------------------------------------------ helpers */

function eventLine(event: SymposiumEvent): string {
  const time = event.startTime ? ` · ${event.startTime}${event.endTime ? `–${event.endTime}` : ''}` : '';
  const price = resolvePrice(event);
  const tier = tierLabel(event);
  // A pass-gated event reads as its requirement, not as "Free".
  const cost = tier && price.amount === 0 ? ` · ${tier}` : price.unspecified ? '' : ` · ${price.display}`;
  return `<a class="s4-assistant-result" data-route="/event/${encodeURIComponent(event.id)}" href="/event/${encodeURIComponent(
    event.id
  )}"><span><b>${esc(event.name)}</b><small>${esc(event.date ?? 'Date to be announced')}${time} · ${esc(
    CATEGORY_LABELS[event.category]
  )}${cost}</small></span><i>↗</i></a>`;
}

function list(events: SymposiumEvent[], limit = 6): string {
  return events.slice(0, limit).map(eventLine).join('');
}

function link(href: string, label: string): string {
  return `<a class="s4-assistant-link" data-route="${href}" href="${href}">${label} <b>↗</b></a>`;
}

/** Chips offered under an answer, so there is always a next thing to press. */
function suggest(...queries: string[]): string {
  return `<div class="s4-assistant-followups">${queries
    .map(query => `<button type="button" data-query="${esc(query)}">${esc(query)}</button>`)
    .join('')}</div>`;
}

const registerable = () => EVENTS.filter(event => event.registerable);

/* ------------------------------------------------------------------ intents */

function greeting(): string {
  return `<p>Hello. I'm the field guide for <b>STRIATUM 4.0</b> — I know all ${EVENTS.length} activities, what they cost, when they run and how to enter.</p><p>What would you like to know?</p>${suggest(
    'What events are there?',
    'How much does it cost?',
    'What is a delegate pass?',
    'How do I register?'
  )}`;
}

function capabilities(): string {
  return `<p>I can answer from the conclave catalogue. Things I'm good at:</p>
    <ul class="s4-assistant-list">
      <li>Finding an event by name, specialty or category</li>
      <li>Fees, free entries and prize money</li>
      <li>Dates, timings and the programme</li>
      <li>Delegate passes and what each tier includes</li>
      <li>How to register, abstracts and deadlines</li>
      <li>Who to contact</li>
    </ul>${suggest('Show me the workshops', 'Which events are free?', 'What are the dates?', 'Who do I contact?')}`;
}

function fees(): string {
  const priced = registerable()
    .map(event => resolvePrice(event))
    .filter(price => !price.unspecified && price.amount !== null && price.amount > 0)
    .map(price => price.amount as number);
  const free = registerable().filter(event => {
    const price = resolvePrice(event);
    return !price.unspecified && price.amount === 0;
  });
  const low = Math.min(...priced);
  const high = Math.max(...priced);
  return `<p>Fees are set per activity — there is no single conclave ticket. Paid entries run from <b>${formatINR(
    low
  )}</b> to <b>${formatINR(high)}</b>, and ${
    free.length
      ? `<b>${free.length}</b> ${free.length === 1 ? 'entry costs' : 'entries cost'} nothing`
      : 'some entries cost nothing'
  }.</p>
  <p>A Delegate Pass is separate: <b>${DELEGATE_PASS_TIERS.AQUALUME.label}</b> ${formatINR(
    DELEGATE_PASS_TIERS.AQUALUME.fee
  )} or <b>${DELEGATE_PASS_TIERS.SYNEXA.label}</b> ${formatINR(DELEGATE_PASS_TIERS.SYNEXA.fee)}.</p>
  ${link('/explore', 'See every activity with its fee')}${suggest(
    'Which events are free?',
    'What is a delegate pass?',
    'Are there combo offers?'
  )}`;
}

function freeEvents(): string {
  const free = registerable().filter(event => {
    const price = resolvePrice(event);
    return !price.unspecified && price.amount === 0;
  });
  if (!free.length) return `<p>Every activity currently carries a fee.</p>${link('/explore', 'Browse all activities')}`;
  return `<p>These cost nothing to enter:</p>${list(free)}<p class="s4-assistant-note">Abstract-first events are free to submit to — a fee applies only if your entry is selected.</p>`;
}

function delegatePass(): string {
  const tier2Only = EVENTS.filter(event => event.delegatePassRequirement === 'required');
  return `<p>A Delegate Pass is your conclave access, bought once and separate from individual event fees.</p>
    <ul class="s4-assistant-list">
      <li><b>${DELEGATE_PASS_TIERS.AQUALUME.label}</b> — ${formatINR(
        DELEGATE_PASS_TIERS.AQUALUME.fee
      )} · delegate access to STRIATUM 4.0</li>
      <li><b>${DELEGATE_PASS_TIERS.SYNEXA.label}</b> — ${formatINR(
        DELEGATE_PASS_TIERS.SYNEXA.fee
      )} · delegate access plus Gala Night and Treasure Hunt</li>
    </ul>
    ${tier2Only.length ? `<p><b>${tier2Only.length}</b> workshops require a pass to register.</p>` : ''}
    <p class="s4-assistant-note">IGMCRI students pay nothing for ${
      DELEGATE_PASS_TIERS.AQUALUME.label
    } — your student ID card is what confirms it.</p>
    ${link('/delegate', 'Open delegate registration')}${suggest('How do I register?', 'What events are there?')}`;
}

function howToRegister(): string {
  return `<p>Registration runs entirely in the app:</p>
    <ol class="s4-assistant-list is-ordered">
      <li>Open the event and press <b>Register</b></li>
      <li>Fill in your details and your team, if it takes one</li>
      <li>Add it to your cart — you can collect several events</li>
      <li>Pay by UPI and upload the screenshot</li>
      <li>The organisers verify it and your place is confirmed</li>
    </ol>
    <p class="s4-assistant-note">Events that ask for an abstract take the file on the same step, before you can submit.</p>
    ${link('/explore', 'Pick an event to register for')}${suggest('Which events are free?', 'Who do I contact?')}`;
}

function abstracts(): string {
  const needs = EVENTS.filter(event => event.requiresAbstract);
  const first = needs.filter(event => event.abstractFirst);
  return `<p><b>${needs.length}</b> activities ask for an abstract, uploaded with your entry — PDF, Word or PowerPoint, up to 10 MB.</p>
    ${list(needs, 8)}
    ${
      first.length
        ? `<p class="s4-assistant-note">${first
            .map(event => esc(event.name))
            .join(', ')} take the abstract instead of a payment — submitting is free, and the fee applies only if your entry is selected.</p>`
        : ''
    }`;
}

function dates(): string {
  const rows = allEventDates()
    .map(
      date =>
        (() => {
          const count = EVENTS.filter(event => event.isoDate === date.iso).length;
          return `<a class="s4-assistant-date" data-route="/programme" href="/programme"><b>${esc(
            date.display
          )}</b><span>${count} ${count === 1 ? 'activity' : 'activities'} ↗</span></a>`;
        })()
    )
    .join('');
  return `<p>The conclave runs <b>14–18 OCT 2026</b>. Dated activity windows:</p><div class="s4-assistant-dates">${rows}</div>${link(
    '/programme',
    'Open the full programme'
  )}`;
}

function venue(): string {
  const venues = [...new Set(EVENTS.map(event => event.venue).filter(Boolean) as string[])];
  return `<p>STRIATUM 4.0 is held at <b>Indira Gandhi Medical College &amp; Research Institute</b>, Puducherry.</p>${
    venues.length
      ? `<p class="s4-assistant-note">Named rooms so far: ${venues.map(esc).join(', ')}. Anything not listed is announced nearer the date.</p>`
      : `<p class="s4-assistant-note">Room allocations are announced nearer the date.</p>`
  }${link('/programme', 'See the programme')}`;
}

function contact(): string {
  return `<p>For registration and combo enquiries, contact <b>${esc(REGISTRATION_CONTACT.name)}</b>${
    REGISTRATION_CONTACT.phone
      ? ` — <a class="s4-assistant-inline" href="tel:${telNumber(REGISTRATION_CONTACT.phone)}">${esc(
          REGISTRATION_CONTACT.phone
        )}</a>`
      : ''
  }.</p>
  <p>Every event also lists its own in-charges on its page, with their numbers.</p>
  <a class="s4-assistant-link" href="${STRIATUM_COMMUNITY_URL}" target="_blank" rel="noopener noreferrer">Join the STRIATUM WhatsApp community <b>↗</b></a>`;
}

function prizes(): string {
  const withPrizes = EVENTS.filter(event => (event.prizes?.totalValue ?? 0) > 0).sort(
    (a, b) => (b.prizes?.totalValue ?? 0) - (a.prizes?.totalValue ?? 0)
  );
  if (!withPrizes.length) return `<p>Prize details are announced per event on its page.</p>${link('/explore', 'Browse activities')}`;
  const total = withPrizes.reduce((sum, event) => sum + (event.prizes?.totalValue ?? 0), 0);
  const rows = withPrizes
    .slice(0, 6)
    .map(
      event =>
        `<a class="s4-assistant-result" data-route="/event/${encodeURIComponent(event.id)}" href="/event/${encodeURIComponent(
          event.id
        )}"><span><b>${esc(event.name)}</b><small>${formatINR(
          event.prizes?.totalValue ?? 0
        )} prize pool</small></span><i>↗</i></a>`
    )
    .join('');
  return `<p><b>${formatINR(total)}</b> in prize money across ${withPrizes.length} activities. The biggest pools:</p>${rows}`;
}

function combos(): string {
  return `<p>Combo offers bundle two or three activities for less than booking them separately. The discount is applied automatically in your cart.</p>${link(
    '/combos',
    'See the combo offers'
  )}`;
}

function myStuff(): string {
  return `<p>Everything you have registered for — confirmed, awaiting payment or awaiting verification — is in your registration hub.</p>${link(
    '/my-events',
    'Open my events'
  )}${link('/delegate/pass', 'Open my delegate pass')}`;
}

/**
 * How to count each category.
 *
 * The label alone does not pluralise: "quiz" needs "quizzes", "research" does
 * not pluralise at all, and "4 creatives" describes people rather than events.
 */
const CATEGORY_NOUN: Record<EventCategory, [string, string]> = {
  workshop: ['workshop', 'workshops'],
  quiz: ['quiz', 'quizzes'],
  presentation: ['presentation', 'presentations'],
  research: ['research activity', 'research activities'],
  innovation: ['innovation activity', 'innovation activities'],
  creative: ['creative activity', 'creative activities'],
  game: ['experience', 'experiences'],
  exhibition: ['exhibition', 'exhibitions']
};

function categoryAnswer(category: EventCategory): string {
  const inCategory = EVENTS.filter(event => event.category === category);
  const [one, many] = CATEGORY_NOUN[category];
  return `<p><b>${inCategory.length}</b> ${esc(
    inCategory.length === 1 ? one : many
  )} at the conclave:</p>${list(inCategory, 10)}`;
}

/** Lunch is a real, answerable fact: full-day workshops collect a preference. */
function food(): string {
  const fullDay = EVENTS.filter(isFullDayWorkshop);
  if (!fullDay.length) {
    return `<p>Meals are not handled through the app. The organisers can tell you what is provided.</p>${link(
      '/explore',
      'Browse activities'
    )}`;
  }
  return `<p>Lunch is included for the full-day workshops, and they ask for a <b>vegetarian or non-vegetarian</b> preference when you register:</p>${list(
    fullDay,
    8
  )}<p class="s4-assistant-note">Anything else about meals on the day is best asked of the organisers.</p>`;
}

/** No accommodation data is published here, so say that rather than guess. */
function accommodation(): string {
  return `<p>Accommodation is not arranged through this app, and I have no published details for it. The organisers handle it directly.</p>${contact()}`;
}

/* ------------------------------------------------------------------- search */

const TOPIC_ALIASES: Record<string, string[]> = {
  ortho: ['orthopaedics', 'orthopedics', 'musculoskeletal'],
  orthopedic: ['orthopaedics', 'orthopedics', 'musculoskeletal'],
  orthopaedic: ['orthopaedics', 'orthopedics', 'musculoskeletal'],
  cardio: ['cardiology', 'cardiovascular'],
  neuro: ['neurology', 'neuroscience', 'neurosurgery'],
  paeds: ['paediatrics', 'pediatrics', 'child health'],
  peds: ['paediatrics', 'pediatrics', 'child health'],
  ent: ['otorhinolaryngology', 'ent'],
  skin: ['dermatology'],
  cancer: ['oncology'],
  obg: ['obstetrics', 'gynaecology'],
  gynae: ['obstetrics', 'gynaecology'],
  public: ['public health', 'community medicine'],
  emergency: ['emergency medicine', 'trauma'],
  suture: ['suturing', 'surgery'],
  ultrasound: ['sonography', 'usg', 'radiology']
};

/** Words that carry no signal, so they never drag an unrelated event in. */
const STOPWORDS = new Set([
  'the','and','for','are','any','can','you','what','when','where','which','how','about','tell','show','give','with',
  'have','has','does','did','was','were','from','that','this','there','their','they','need','want','like','please',
  'info','information','details','detail','event','events','more','all','some','get','see','find','know','into','also'
]);

/**
 * Scores an event against the query, so the closest thing comes first instead
 * of whichever event happened to sit earliest in the catalogue.
 */
function search(raw: string, terms: string[]): SymposiumEvent[] {
  const query = raw.trim().toLowerCase();
  const expanded = [...terms, ...terms.flatMap(term => TOPIC_ALIASES[term] ?? [])];
  if (!expanded.length) return [];

  const scored = EVENTS.map(event => {
    const name = event.name.toLowerCase();
    const specialties = event.specialties.join(' ').toLowerCase();
    const keywords = (event.keywords ?? []).join(' ').toLowerCase();
    const format = event.format.toLowerCase();
    let score = 0;

    if (name === query) score += 100;
    else if (name.includes(query) && query.length > 2) score += 60;

    for (const term of expanded) {
      if (name.includes(term)) score += 12;
      if (specialties.includes(term)) score += 6;
      if (keywords.includes(term)) score += 5;
      if (format.includes(term)) score += 4;
      if (CATEGORY_LABELS[event.category].toLowerCase().includes(term)) score += 3;
    }
    return { event, score };
  })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(entry => entry.event);
}

/* -------------------------------------------------------------------- entry */

function answer(raw: string): string {
  const query = raw.trim().toLowerCase();
  if (!query) return greeting();

  const has = (re: RegExp) => re.test(query);

  // Conversation first. These are short and would be discarded by the search.
  if (has(/^(hi|hey|hello|yo|hai|helo|hii+|heya|sup|namaste|vanakkam)\b/) || has(/^good\s+(morning|afternoon|evening|night)/)) {
    return greeting();
  }
  if (has(/^(thanks|thank you|thx|ty|nice|cool|ok|okay|great|awesome)\b/)) {
    return `<p>Any time. Ask me anything else about the conclave.</p>${suggest(
      'What are the dates?',
      'Which events are free?',
      'Who do I contact?'
    )}`;
  }
  if (has(/^(bye|goodbye|see ya|cya)\b/)) return `<p>See you at the conclave.</p>`;
  if (has(/who are you|what are you|what can you do|help me|^help$|how do you work/)) return capabilities();

  // Intent, most specific first.
  if (has(/\b(combo|combos|bundle|bundles|offer|offers|discount|discounts|package|packages)\b/)) return combos();
  if (has(/\b(free|no fee|without paying|zero cost|costs? nothing|nothing to pay)\b/)) return freeEvents();
  if (has(/\b(abstract|abstracts|synopsis|submission|submissions|submit my)\b/)) return abstracts();
  if (has(/\b(prize|prizes|prize pool|cash|reward|rewards|winnings?|how much can i win)\b/)) return prizes();
  if (has(/\b(delegate|delegates|pass|passes|aqualume|synexa)\b/)) return delegatePass();
  if (has(/how (do|can) i (register|sign ?up|enrol|enroll|join|apply)|registration process|how to register|steps to register/)) {
    return howToRegister();
  }
  if (has(/\b(fee|fees|cost|costs|price|prices|charge|charges|payment|how much|rupees)\b|₹/)) return fees();
  if (has(/\b(food|lunch|meals?|snacks?|breakfast|dinner|coffee|tea|water|veg|non.?veg|vegetarian|refreshments?|eat|eating)\b/)) return food();
  if (has(/\b(accommodation|accomodation|stay|hostel|hotel|lodging|where do i sleep)\b/)) return accommodation();
  if (has(/\b(venue|where|located|location|address|campus|hall|halls|auditorium|directions|how do i get there)\b/)) return venue();
  if (has(/\b(contact|contacts|phone|mobile|number|whatsapp|email|reach out|organiser|organizer|organisers|in.?charge|coordinator|coordinators)\b/)) return contact();
  if (has(/my (event|registration|order|pass|ticket)|registration hub|what did i register|my cart/)) return myStuff();
  if (has(/\b(date|dates|when|schedule|programme|program|timing|timings|time table|timetable)\b/)) return dates();
  if (has(/\b(explore|all events|everything|event list|activities|what events|what.s on|whats on)\b/)) {
    return `<p>There are <b>${EVENTS.length} activities</b> across workshops, quizzes, presentations, research, creative work, games and exhibitions.</p>${link(
      '/explore',
      'Open the full event directory'
    )}${suggest('Show me the workshops', 'Show me the quizzes', 'Show me the games')}`;
  }

  // Category by name. "zes" so quiz -> quizzes, the plural people type.
  const plural = (word: string) => new RegExp(`\\b${word}(s|es|zes)?\\b`);
  const categoryHit = (Object.keys(CATEGORY_LABELS) as EventCategory[]).find(category => {
    const label = CATEGORY_LABELS[category].toLowerCase();
    return has(plural(category)) || has(plural(label));
  });
  if (categoryHit) return categoryAnswer(categoryHit);

  // Otherwise: search the catalogue.
  const terms = query
    .split(/[^a-z0-9]+/)
    .filter(term => term.length > 2 && !STOPWORDS.has(term));
  const matches = search(raw, terms);

  if (matches.length === 1) {
    const event = matches[0];
    const price = resolvePrice(event);
    return `<p><b>${esc(event.name)}</b> — ${esc(event.format)}${
      event.date ? `, ${esc(event.date)}` : ''
    }${price.unspecified ? '' : ` · ${price.display}`}</p>${eventLine(event)}`;
  }
  if (matches.length) {
    return `<p>${matches.length} ${matches.length === 1 ? 'activity' : 'activities'} match <b>${esc(
      raw.trim()
    )}</b>:</p>${list(matches, 6)}${
      matches.length > 6 ? link('/explore', 'See all activities') : ''
    }`;
  }

  return `<p>I couldn't find that in the conclave catalogue. I can help with events, fees, dates, delegate passes, registration or contacts.</p>${suggest(
    'What events are there?',
    'How much does it cost?',
    'What are the dates?',
    'Who do I contact?'
  )}${link('/explore', 'Or browse everything')}`;
}

/* ------------------------------------------------------------------- mount */

export function mountStriatumAssistant(): void {
  if (document.getElementById('s4-assistant')) return;
  const root = document.createElement('aside');
  root.id = 's4-assistant';
  root.innerHTML = `<button class="s4-assistant-orb" aria-label="Open STRIATUM field guide"><span class="s4-assistant-avatar" aria-hidden="true"></span></button>
    <section class="s4-assistant-panel" aria-label="STRIATUM event assistant">
      <header><div class="s4-assistant-mark"><span></span><span></span><span></span></div><div><strong>STRIATUM FIELD GUIDE</strong><small>LIVE CONCLAVE INDEX</small></div><button class="s4-assistant-close" aria-label="Close">×</button></header>
      <div class="s4-assistant-feed"><div class="s4-assistant-message"><small>INDEX / 4.0</small>${greeting()}</div></div>
      <div class="s4-assistant-chips"><button data-query="What are the dates?">DATES</button><button data-query="How much does it cost?">FEES</button><button data-query="Show all activities">EXPLORE</button><button data-query="Tell me about delegate pass">DELEGATE PASS</button></div>
      <form class="s4-assistant-form"><input aria-label="Ask about STRIATUM" placeholder="Ask me anything…" autocomplete="off"><button aria-label="Send">↗</button></form>
    </section>`;
  document.body.appendChild(root);

  const panel = root.querySelector<HTMLElement>('.s4-assistant-panel')!;
  const feed = root.querySelector<HTMLElement>('.s4-assistant-feed')!;
  const orb = root.querySelector<HTMLButtonElement>('.s4-assistant-orb')!;

  const close = () => {
    panel.classList.remove('is-open');
    root.classList.remove('is-active');
  };

  const submit = (query: string) => {
    if (!query.trim()) return;
    feed.insertAdjacentHTML(
      'beforeend',
      `<div class="s4-assistant-user">${esc(query)}</div><div class="s4-assistant-message">${answer(query)}</div>`
    );
    feed.scrollTop = feed.scrollHeight;
  };

  orb.onclick = () => {
    panel.classList.add('is-open');
    root.classList.add('is-active');
    root.querySelector<HTMLInputElement>('input')?.focus();
  };
  root.querySelector('.s4-assistant-close')?.addEventListener('click', close);

  // One delegated listener, because answers add their own chips and links after
  // mount and per-element listeners would never reach them.
  root.addEventListener('click', event => {
    const target = event.target as HTMLElement;

    const chip = target.closest<HTMLButtonElement>('[data-query]');
    if (chip) {
      submit(chip.dataset.query ?? '');
      return;
    }

    // Keep navigation inside the app: a bare href would reload the whole page.
    const routed = target.closest<HTMLAnchorElement>('[data-route]');
    if (routed) {
      const route = routeFromPath(new URL(routed.href, window.location.origin).pathname);
      if (route) {
        event.preventDefault();
        close();
        if (route.eventId) appStore.openEvent(route.eventId);
        else appStore.setScreen(route.screen);
      }
    }
  });

  root.querySelector('form')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = root.querySelector<HTMLInputElement>('input')!;
    submit(input.value);
    input.value = '';
  });
}
