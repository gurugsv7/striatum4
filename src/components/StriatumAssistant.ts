import { EVENTS, allEventDates } from '../data/events.ts';
import { CATEGORY_LABELS } from '../data/eventTypes.ts';
import '../styles/assistant.css';

const esc = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);

function eventLine(event: typeof EVENTS[number]): string {
  const time = event.startTime ? ` · ${event.startTime}${event.endTime ? `–${event.endTime}` : ''}` : '';
  return `<a class="s4-assistant-result" href="/event/${encodeURIComponent(event.id)}"><span><b>${esc(event.name)}</b><small>${esc(event.date ?? 'Date to be announced')}${time} · ${esc(CATEGORY_LABELS[event.category])}</small></span><i>↗</i></a>`;
}

function answer(raw: string): string {
  const query = raw.trim().toLowerCase();
  if (!query) return `<p>Ask me about an event, date, category, fees, schedule, delegate pass, or registration.</p>`;
  if (/date|when|schedule|programme|program/.test(query)) {
    const dates = allEventDates().map(date => `<a class="s4-assistant-date" href="/programme"><b>${esc(date.display)}</b><span>${EVENTS.filter(event => event.isoDate === date.iso).length} activities ↗</span></a>`).join('');
    return `<p>The symposium programme runs <b>14–18 OCT 2026</b>. Here are the dated activity windows:</p><div class="s4-assistant-dates">${dates}</div>`;
  }
  if (/delegate|pass|aqualume|synexa|register/.test(query)) return `<p>A Delegate Pass unlocks the delegate-only workshops and symposium access. Start your application here:</p><a class="s4-assistant-link" href="/delegate">Open delegate registration <b>↗</b></a>`;
  if (/explore|all event|everything|event list|activities/.test(query)) return `<p>There are <b>${EVENTS.length} activities</b> across workshops, quizzes, research, creative work, games and exhibitions.</p><a class="s4-assistant-link" href="/explore">Open the full event directory <b>↗</b></a>`;
  const matches = EVENTS.filter(event => [event.name, event.format, event.category, ...event.specialties, ...(event.keywords ?? [])].join(' ').toLowerCase().includes(query));
  if (matches.length) return `<p>I found ${matches.length === 1 ? 'the activity' : `${matches.length} activities`} matching <b>${esc(raw)}</b>:</p>${matches.slice(0, 5).map(eventLine).join('')}`;
  return `<p>I couldn’t match that to the confirmed symposium catalogue. Try an event name, specialty, “dates”, “delegate pass”, or “explore”.</p><a class="s4-assistant-link" href="/explore">Browse all activities <b>↗</b></a>`;
}

export function mountStriatumAssistant(): void {
  if (document.getElementById('s4-assistant')) return;
  const root = document.createElement('aside');
  root.id = 's4-assistant';
  root.innerHTML = `<button class="s4-assistant-orb" aria-label="Open STRIATUM field guide"><span class="s4-assistant-avatar" aria-hidden="true"></span></button>
    <section class="s4-assistant-panel" aria-label="STRIATUM event assistant">
      <header><div class="s4-assistant-mark"><span></span><span></span><span></span></div><div><strong>STRIATUM FIELD GUIDE</strong><small>LIVE SYMPOSIUM INDEX</small></div><button class="s4-assistant-close" aria-label="Close">×</button></header>
      <div class="s4-assistant-feed"><div class="s4-assistant-message"><small>INDEX / 4.0</small><p>I can navigate the symposium catalogue for you. What are you looking for?</p></div></div>
      <div class="s4-assistant-chips"><button data-query="What are the dates?">DATES</button><button data-query="Show all activities">EXPLORE</button><button data-query="Tell me about delegate pass">DELEGATE PASS</button></div>
      <form class="s4-assistant-form"><input aria-label="Ask about STRIATUM" placeholder="Search the field guide…" autocomplete="off"><button aria-label="Send">↗</button></form>
    </section>`;
  document.body.appendChild(root);
  const panel = root.querySelector<HTMLElement>('.s4-assistant-panel')!;
  const feed = root.querySelector<HTMLElement>('.s4-assistant-feed')!;
  const orb = root.querySelector<HTMLButtonElement>('.s4-assistant-orb')!;
  const submit = (query: string) => { if (!query.trim()) return; feed.insertAdjacentHTML('beforeend', `<div class="s4-assistant-user">${esc(query)}</div><div class="s4-assistant-message">${answer(query)}</div>`); feed.scrollTop = feed.scrollHeight; };
  orb.onclick = () => { panel.classList.add('is-open'); root.classList.add('is-active'); root.querySelector<HTMLInputElement>('input')?.focus(); };
  root.querySelector('.s4-assistant-close')?.addEventListener('click', () => { panel.classList.remove('is-open'); root.classList.remove('is-active'); });
  root.querySelectorAll<HTMLButtonElement>('[data-query]').forEach(button => button.addEventListener('click', () => submit(button.dataset.query ?? '')));
  root.querySelector('form')?.addEventListener('submit', event => { event.preventDefault(); const input = root.querySelector<HTMLInputElement>('input')!; submit(input.value); input.value = ''; });
}
