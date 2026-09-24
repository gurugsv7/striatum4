import { appStore } from '../state/appStore.ts';
import * as registration from '../services/registrationService.ts';
import { getEvent } from '../data/events.ts';
import { SymposiumEvent } from '../data/eventTypes.ts';
import { formatINR, resolvePrice, defaultParticipation } from '../services/pricing.ts';
import { isFullDayWorkshop } from '../services/workshop.ts';
import {
  EventRegistrationSchema,
  MemberField,
  YEAR_VALUES,
  schemaFor
} from '../data/registrationSchemas.ts';
import {
  EventRegistrationIntent,
  Participant,
  TeamRoster,
  blankIntent,
  emptyParticipant,
  validateIntent,
  ValidationIssue
} from '../services/registrationForm.ts';
import { COMBO_OFFERS, comboTitle, comboEvents } from '../data/combos.ts';
import { escapeHtml as esc } from '../services/text.ts';

/**
 * 05 / REGISTRATION — the one form.
 *
 * A single event opens it with one section per requirement. A combo opens the
 * same screen with one section per included event, so a bundle is still one
 * form, one submission, one button — while producing a separate, complete
 * registration for every event inside it.
 *
 * The draft lives in this module rather than in the store: the app re-renders
 * wholesale on every store change, and a form that re-rendered on each
 * keystroke would lose the caret. Typing mutates the draft silently; only
 * structural edits (adding a member, choosing a meal) trigger a re-render.
 */

interface Draft {
  kind: 'event' | 'combo';
  /** Event id or combo id. */
  id: string;
  /** One intent per event being registered. */
  intents: Record<string, EventRegistrationIntent>;
  /** True when reopened from the cart to change an existing registration. */
  editing: boolean;
  /** Populated after a failed submit so the form can show what is wrong. */
  issues: Record<string, ValidationIssue[]>;
  submitted: boolean;
}

let draft: Draft | null = null;

function prefill(eventId: string) {
  // Organisers often book workshops for someone else. Do not silently copy the
  // organiser's own name and finance email into that attendee's roster.
  if (registration.isAdmin() && getEvent(eventId)?.category === 'workshop') return {};
  const delegate = registration.getDelegate();
  const form = appStore.getState().delegateForm;
  return {
    fullName: delegate?.fullName || form.fullName || '',
    phone: delegate?.phone || form.phone || '',
    email: delegate?.email || form.email || appStore.getState().userEmail || '',
    college: delegate?.institution || form.college || '',
    yearOfStudy: delegate?.yearOfStudy || form.yearOfStudy || ''
  };
}

/** Opens the form for a single event. */
export function startEventRegistration(eventId: string, editing = false): boolean {
  const existing = editing ? registration.intentFor(eventId) : undefined;
  const intent = existing ?? blankIntent(eventId, prefill(eventId));
  if (!intent) return false;
  draft = {
    kind: 'event',
    id: eventId,
    intents: { [eventId]: structuredClone(intent) },
    editing,
    issues: {},
    submitted: false
  };
  appStore.setScreen('registration');
  return true;
}

/** Opens the form for a whole combo. */
export function startComboRegistration(comboId: string, editing = false): boolean {
  const combo = COMBO_OFFERS.find(offer => offer.id === comboId);
  if (!combo) return false;

  const existing = editing ? registration.comboIntents(comboId) : [];
  const intents: Record<string, EventRegistrationIntent> = {};

  for (const eventId of combo.eventIds) {
    const found = existing.find(candidate => candidate.eventId === eventId);
    const fresh = blankIntent(eventId, prefill(eventId), combo.teamsPerEvent);
    if (!found && !fresh) return false;
    intents[eventId] = structuredClone(found ?? (fresh as EventRegistrationIntent));
  }

  draft = { kind: 'combo', id: comboId, intents, editing, issues: {}, submitted: false };
  appStore.setScreen('registration');
  return true;
}

export function clearDraft(): void {
  draft = null;
}

/* ------------------------------------------------------------- rendering -- */

const FIELD_LABEL: Record<MemberField, string> = {
  name: 'Full name',
  year: 'Year of study',
  college: 'College / Institution',
  phone: 'Contact number',
  email: 'Email'
};

function issueFor(
  eventId: string,
  teamIndex: number,
  position: number | undefined,
  field: string
): string | null {
  const list = draft?.issues[eventId] ?? [];
  const hit = list.find(
    issue => issue.teamIndex === teamIndex && issue.position === position && issue.field === field
  );
  return hit?.message ?? null;
}

function textField(
  eventId: string,
  teamIndex: number,
  position: number,
  field: MemberField,
  value: string,
  required: boolean
): string {
  const id = `reg-${eventId}-${teamIndex}-${position}-${field}`;
  const error = issueFor(eventId, teamIndex, position, field);
  const type = field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text';

  if (field === 'year') {
    return `
      <div class="input-card-box ${error ? 'has-error' : ''}">
        <div class="input-card-col">
          <label class="input-card-lbl" for="${id}">${FIELD_LABEL[field]}${required ? '' : ' (optional)'}</label>
          <select class="input-card-select" id="${id}"
                  data-reg-field="${field}" data-reg-event="${eventId}"
                  data-reg-team="${teamIndex}" data-reg-pos="${position}">
            <option value="">Select year</option>
            ${YEAR_VALUES.map(
              option => `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`
            ).join('')}
          </select>
        </div>
        ${error ? `<span class="reg-field-error">${esc(error)}</span>` : ''}
      </div>`;
  }

  return `
    <div class="input-card-box ${error ? 'has-error' : ''}">
      <div class="input-card-col">
        <label class="input-card-lbl" for="${id}">${FIELD_LABEL[field]}${required ? '' : ' (optional)'}</label>
        <input class="input-card-core" id="${id}" type="${type}"
               value="${esc(value)}" autocomplete="off"
               placeholder="${FIELD_LABEL[field]}"
               data-reg-field="${field}" data-reg-event="${eventId}"
               data-reg-team="${teamIndex}" data-reg-pos="${position}" />
      </div>
      ${error ? `<span class="reg-field-error">${esc(error)}</span>` : ''}
    </div>`;
}

function fieldsForPosition(schema: EventRegistrationSchema, position: number): MemberField[] {
  const base: MemberField[] =
    position === 1 ? ['name', 'year', 'phone', 'email'] : [...schema.memberFields];
  if (!schema.sameCollege && !base.includes('college')) base.push('college');
  return base;
}

function renderMember(
  schema: EventRegistrationSchema,
  eventId: string,
  team: TeamRoster,
  person: Participant,
  removable: boolean
): string {
  const role = person.position === 1 ? (schema.maxMembers > 1 ? 'CAPTAIN / PRIMARY CONTACT' : 'PARTICIPANT') : `MEMBER ${person.position}`;

  return `
    <div class="reg-member">
      <div class="reg-member-head">
        <span class="reg-member-bead"></span>
        <span class="reg-member-role">${role}</span>
        ${
          removable
            ? `<button class="reg-member-remove" data-reg-remove="${eventId}"
                       data-reg-team="${team.teamIndex}" data-reg-pos="${person.position}">REMOVE</button>`
            : ''
        }
      </div>
      <div class="details-input-stack">
        ${fieldsForPosition(schema, person.position)
          .map(field =>
            textField(
              eventId,
              team.teamIndex,
              person.position,
              field,
              (person[field as keyof Participant] as string) ?? '',
              field !== 'email' || person.position === 1
            )
          )
          .join('')}
      </div>
    </div>`;
}

function renderTeam(
  schema: EventRegistrationSchema,
  event: SymposiumEvent,
  team: TeamRoster,
  showTeamHeading: boolean
): string {
  const canAdd = team.participants.length < schema.maxMembers;
  const canRemove = team.participants.length > schema.minMembers;
  const rosterError = issueFor(event.id, team.teamIndex, undefined, 'roster');
  const yearError = issueFor(event.id, team.teamIndex, undefined, 'year');
  const collegeError = issueFor(event.id, team.teamIndex, undefined, 'teamCollege');

  return `
    <div class="reg-team">
      ${
        showTeamHeading
          ? `<div class="reg-team-head">
              <span class="reg-team-index">TEAM ${String(team.teamIndex).padStart(2, '0')}</span>
              <span class="reg-team-rule"></span>
            </div>`
          : ''
      }

      ${
        schema.sameCollege
          ? `<div class="input-card-box ${collegeError ? 'has-error' : ''}">
              <div class="input-card-col">
                <label class="input-card-lbl" for="reg-college-${event.id}-${team.teamIndex}">
                  College / Institution &middot; all members
                </label>
                <input class="input-card-core" id="reg-college-${event.id}-${team.teamIndex}" type="text"
                       value="${esc(team.teamCollege ?? '')}" autocomplete="off"
                       placeholder="One college for the whole team"
                       data-reg-teamcollege="${event.id}" data-reg-team="${team.teamIndex}" />
              </div>
              ${collegeError ? `<span class="reg-field-error">${esc(collegeError)}</span>` : ''}
            </div>`
          : ''
      }

      ${team.participants
        .map(person => renderMember(schema, event.id, team, person, canRemove && person.position !== 1))
        .join('')}

      ${rosterError ? `<p class="reg-error-line">${esc(rosterError)}</p>` : ''}
      ${yearError ? `<p class="reg-error-line">${esc(yearError)}</p>` : ''}

      ${
        canAdd
          ? `<button class="reg-add-member" data-reg-add="${event.id}" data-reg-team="${team.teamIndex}">
              <span>+ ADD MEMBER</span>
              <span class="reg-add-hint">${team.participants.length} of ${schema.maxMembers}</span>
            </button>`
          : ''
      }
    </div>`;
}

function renderLunch(eventId: string, current?: string): string {
  const error = issueFor(eventId, 1, undefined, 'lunch');
  return `
    <div class="reg-lunch">
      <p class="reg-lunch-note">
        Meals are provided for full-day workshop delegates. Tell the organisers your preference.
      </p>
      <div class="participation-options">
        <button class="participation-option ${current === 'veg' ? 'active' : ''}"
                data-reg-lunch="${eventId}" data-reg-lunch-value="veg">
          <span>Vegetarian</span>
        </button>
        <button class="participation-option ${current === 'non_veg' ? 'active' : ''}"
                data-reg-lunch="${eventId}" data-reg-lunch-value="non_veg">
          <span>Non-vegetarian</span>
        </button>
      </div>
      ${error ? `<p class="reg-error-line">${esc(error)}</p>` : ''}
    </div>`;
}

function section(index: string, title: string, body: string, meta?: string): string {
  return `
    <div class="timeline-step-block">
      <div class="timeline-bead"></div>
      <div class="reg-section-head">
        <span class="reg-section-index">${index}</span>
        <span class="reg-section-title">${title}</span>
        ${meta ? `<span class="reg-section-meta">${meta}</span>` : ''}
      </div>
      ${body}
    </div>`;
}

function notesBlock(schema: EventRegistrationSchema): string {
  if (!schema.notes.length) return '';
  return `
    <ul class="reg-notes">
      ${schema.notes.map(note => `<li>${esc(note)}</li>`).join('')}
    </ul>`;
}

/** One event's block inside the form. */
function eventBlock(
  eventId: string,
  index: string,
  options: { hideLunch?: boolean; titleOverride?: string } = {}
): string {
  const event = getEvent(eventId);
  const schema = schemaFor(eventId);
  const intent = draft?.intents[eventId];
  if (!event || !schema || !intent) return '';

  const multiTeam = intent.teams.length > 1;
  const rosterBody = intent.teams
    .map(team => renderTeam(schema, event, team, multiTeam))
    .join('');

  const heading =
    options.titleOverride ??
    (multiTeam ? `${event.name} &middot; ${intent.teams.length} TEAMS` : event.name);

  const meta =
    schema.minMembers === schema.maxMembers
      ? schema.maxMembers === 1
        ? 'Individual'
        : `Team of ${schema.maxMembers}`
      : `${schema.minMembers}–${schema.maxMembers} members`;

  const lunch =
    !options.hideLunch && schema.foodPreference ? renderLunch(eventId, intent.lunchChoice) : '';

  return section(index, heading, `${notesBlock(schema)}${rosterBody}${lunch}`, meta);
}

/** True when every event in a combo is a single-participant workshop. */
function isSharedParticipantCombo(eventIds: string[]): boolean {
  return eventIds.every(id => {
    const schema = schemaFor(id);
    const event = getEvent(id);
    return Boolean(schema && event && schema.maxMembers === 1 && event.category === 'workshop');
  });
}

export function renderRegistrationFormView(): string {
  if (!draft) {
    return `<div class="screen-content no-bottom-nav"><div class="empty-search-state">
      <p>No registration in progress.</p>
      <button class="action-link-cyan" id="btn-reg-explore">Explore events &rarr;</button>
    </div></div>`;
  }

  const combo = draft.kind === 'combo' ? COMBO_OFFERS.find(o => o.id === draft!.id) : undefined;
  const eventIds = combo ? combo.eventIds : [draft.id];
  const title = combo ? comboTitle(combo) : getEvent(draft.id)?.name ?? '';

  // A workshop combo is one person attending several workshops: their details
  // are asked once, and the meal question once, not per workshop.
  const shared = Boolean(combo) && isSharedParticipantCombo(eventIds);
  const anyFullDay = eventIds.some(id => {
    const event = getEvent(id);
    return event ? isFullDayWorkshop(event) : false;
  });

  const priceLine = combo
    ? `${formatINR(combo.publishedComboTotal)} · COMBO`
    : (() => {
        const event = getEvent(draft!.id);
        if (!event) return '';
        const price = resolvePrice(event, defaultParticipation(event));
        return price.unspecified ? '' : `${price.display} · ${price.basis}`;
      })();

  let sections = '';
  if (shared) {
    // 01 participant, 02 included events, 03 meal.
    const primaryEvent = eventIds[0];
    sections += eventBlock(primaryEvent, '01', { hideLunch: true, titleOverride: 'PARTICIPANT DETAILS' });
    sections += section(
      '02',
      'INCLUDED',
      `<ul class="reg-included">
        ${comboEvents(combo!)
          .map(
            item =>
              `<li><span class="reg-included-tick">&#10003;</span><span>${esc(item.name)}</span>
               <span class="reg-included-meta">${esc(item.date ?? '')}</span></li>`
          )
          .join('')}
      </ul>
      <p class="reg-shared-note">
        The same participant attends every workshop in this combo, so these details are asked once.
      </p>`
    );
    if (anyFullDay) {
      sections += section('03', 'FOOD PREFERENCE', renderLunch(primaryEvent, draft.intents[primaryEvent]?.lunchChoice));
    }
  } else {
    eventIds.forEach((eventId, position) => {
      sections += eventBlock(eventId, String(position + 1).padStart(2, '0'));
    });
  }

  const confirmIndex = String(
    (shared ? (anyFullDay ? 3 : 2) : eventIds.length) + 1
  ).padStart(2, '0');

  const blocking = Object.values(draft.issues).flat();

  return `
    <div class="screen-content no-bottom-nav">
      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-reg-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span class="back-nav-label">${draft.editing ? 'BACK TO CART' : 'BACK'}</span>
        </button>
      </header>

      <section class="explore-hero-section">
        <div class="section-index-label">
          <span class="cyan-num">05</span>
          <span class="slash">/</span>
          <span class="section-name">${combo ? 'COMBO REGISTRATION' : 'REGISTRATION'}</span>
        </div>
        <h1 class="explore-heading">${esc(title)}<span class="cyan-period">.</span></h1>
        ${priceLine ? `<p class="explore-subtitle">${priceLine}</p>` : ''}
      </section>

      <div class="reg-form-stack">
        ${sections}

        <div class="timeline-step-block">
          <div class="timeline-bead"></div>
          <div class="reg-section-head">
            <span class="reg-section-index">${confirmIndex}</span>
            <span class="reg-section-title">CONFIRM</span>
          </div>

          ${
            draft.submitted && blocking.length
              ? `<div class="reg-summary-errors">
                  ${blocking.slice(0, 4).map(issue => `<p>${esc(issue.message)}</p>`).join('')}
                </div>`
              : `<p class="reg-confirm-note">
                  Check the details above. Payment happens once, for everything in your cart.
                </p>`
          }

          <button class="btn-chamfer-primary" id="btn-reg-submit">
            <span class="btn-cyan-bead"></span>
            <span class="btn-label-text">
              ${draft.editing ? 'SAVE REGISTRATION' : combo ? 'ADD COMBO REGISTRATION TO CART' : 'ADD REGISTRATION TO CART'}
            </span>
          </button>
        </div>
      </div>
    </div>`;
}

/* -------------------------------------------------------------- handlers -- */

function teamOf(eventId: string, teamIndex: number): TeamRoster | undefined {
  return draft?.intents[eventId]?.teams.find(team => team.teamIndex === teamIndex);
}

export function attachRegistrationFormEvents(): void {
  document.getElementById('btn-reg-explore')?.addEventListener('click', () => {
    appStore.setScreen('explore');
  });

  document.getElementById('btn-reg-back')?.addEventListener('click', () => {
    const editing = draft?.editing;
    const kind = draft?.kind;
    const id = draft?.id;
    clearDraft();
    if (editing) appStore.setScreen('cart');
    else if (kind === 'combo') appStore.setScreen('combos');
    else if (id) appStore.openEvent(id);
    else appStore.setScreen('explore');
  });

  // Typing never re-renders; it writes straight into the draft.
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-reg-field]').forEach(input => {
    const commit = () => {
      const eventId = input.getAttribute('data-reg-event')!;
      const teamIndex = Number(input.getAttribute('data-reg-team'));
      const position = Number(input.getAttribute('data-reg-pos'));
      const field = input.getAttribute('data-reg-field') as MemberField;
      const team = teamOf(eventId, teamIndex);
      const person = team?.participants.find(candidate => candidate.position === position);
      if (!person) return;
      (person as unknown as Record<string, string>)[field] = input.value;
    };
    input.addEventListener('input', commit);
    input.addEventListener('change', commit);
  });

  document.querySelectorAll<HTMLInputElement>('[data-reg-teamcollege]').forEach(input => {
    const commit = () => {
      const eventId = input.getAttribute('data-reg-teamcollege')!;
      const teamIndex = Number(input.getAttribute('data-reg-team'));
      const team = teamOf(eventId, teamIndex);
      if (team) team.teamCollege = input.value;
    };
    input.addEventListener('input', commit);
    input.addEventListener('change', commit);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-reg-add]').forEach(button => {
    button.addEventListener('click', () => {
      const eventId = button.getAttribute('data-reg-add')!;
      const teamIndex = Number(button.getAttribute('data-reg-team'));
      const schema = schemaFor(eventId);
      const team = teamOf(eventId, teamIndex);
      if (!schema || !team || team.participants.length >= schema.maxMembers) return;
      team.participants.push(emptyParticipant(team.participants.length + 1));
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-reg-remove]').forEach(button => {
    button.addEventListener('click', () => {
      const eventId = button.getAttribute('data-reg-remove')!;
      const teamIndex = Number(button.getAttribute('data-reg-team'));
      const position = Number(button.getAttribute('data-reg-pos'));
      const team = teamOf(eventId, teamIndex);
      if (!team) return;
      team.participants = team.participants
        .filter(person => person.position !== position)
        .map((person, index) => ({ ...person, position: index + 1, role: index === 0 ? 'captain' : 'member' }));
      appStore.refresh();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-reg-lunch]').forEach(button => {
    button.addEventListener('click', () => {
      const eventId = button.getAttribute('data-reg-lunch')!;
      const value = button.getAttribute('data-reg-lunch-value') as 'veg' | 'non_veg';
      if (!draft) return;
      // A workshop combo asks once and applies the answer to every full-day
      // workshop inside it — the participant is the same person.
      const combo = draft.kind === 'combo' ? COMBO_OFFERS.find(o => o.id === draft!.id) : undefined;
      const targets = combo && isSharedParticipantCombo(combo.eventIds) ? combo.eventIds : [eventId];
      for (const target of targets) {
        const intent = draft.intents[target];
        const event = getEvent(target);
        if (intent && event && isFullDayWorkshop(event)) {
          intent.lunchChoice = value;
          // Answering the question retires its complaint. Leaving it up made a
          // satisfied form still read as invalid until the next submit.
          const remaining = (draft.issues[target] ?? []).filter(issue => issue.field !== 'lunch');
          if (remaining.length) draft.issues[target] = remaining;
          else delete draft.issues[target];
        }
      }
      appStore.refresh();
    });
  });

  document.getElementById('btn-reg-submit')?.addEventListener('click', () => {
    if (!draft) return;

    const combo = draft.kind === 'combo' ? COMBO_OFFERS.find(o => o.id === draft!.id) : undefined;
    const eventIds = combo ? combo.eventIds : [draft.id];

    // A workshop combo collects the participant once; copy them onto every
    // included workshop so each keeps its own complete registration.
    if (combo && isSharedParticipantCombo(eventIds)) {
      const source = draft.intents[eventIds[0]];
      for (const eventId of eventIds.slice(1)) {
        const target = draft.intents[eventId];
        if (target && source) {
          target.teams = structuredClone(source.teams);
        }
      }
    }

    draft.issues = {};
    draft.submitted = true;
    let ok = true;
    for (const eventId of eventIds) {
      const intent = draft.intents[eventId];
      if (!intent) continue;
      const result = validateIntent(intent);
      if (!result.ok) {
        draft.issues[eventId] = result.issues;
        ok = false;
      }
    }

    if (!ok) {
      appStore.refresh();
      appStore.showToast('Some details are still needed.');
      return;
    }

    const intents = eventIds.map(id => draft!.intents[id]).filter(Boolean);
    let result: registration.CartMutationResult;

    if (draft.editing) {
      result = { ok: true, message: 'Registration updated' };
      for (const intent of intents) {
        const saved = registration.replaceRegistration(intent);
        if (!saved.ok) result = saved;
      }
    } else if (combo) {
      result = registration.addComboRegistration(combo.id, intents);
    } else {
      result = registration.addRegistration(intents[0]);
    }

    appStore.showToast(result.message);
    if (result.ok) {
      clearDraft();
      appStore.setScreen('cart');
    }
  });
}
