import { appStore } from '../state/appStore.ts';

/* ============================================================================
 * Privacy Policy and Terms of Registration.
 *
 * Written to describe what this system ACTUALLY does — the fields the delegate
 * form collects, where payment screenshots are stored and who can read them,
 * and which symposium rules come from the official brochure. Nothing here is
 * generic filler, and no rule was invented: where the organisers have not
 * published a policy (refunds being the notable one), the text says so and
 * points at the organising committee rather than making one up.
 *
 * Both documents are reachable at /privacy and /terms, which is also what
 * Google's OAuth consent screen requires before the app can be published.
 * ========================================================================== */

export const LEGAL_LAST_UPDATED = '9 September 2026';
export const ORGANISER_EMAIL = 'striatum04@gmail.com';

interface Clause {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

const PRIVACY: Clause[] = [
  {
    heading: 'WHO WE ARE',
    paragraphs: [
      'STRIATUM 4.0 is the medical symposium of Indira Gandhi Medical College &amp; Research Institute (IGMCRI), Puducherry, presented by SIGMA 2026. This policy covers the registration website only. It does not cover the college&rsquo;s other systems, or anything that happens off this site.'
    ]
  },
  {
    heading: 'WHAT WE COLLECT',
    paragraphs: ['We collect only what registration and verification actually require.'],
    bullets: [
      'When you sign in with Google: your name, email address and profile picture, taken from your Google account. We never see or receive your Google password.',
      'When you sign in by email: your email address. We send a one-time sign-in link. No password is created or stored.',
      'When you apply for a Delegate Pass: your full name, phone number, email address, college or institution, course and year of study.',
      'When you register for events: the events you select, the fee for each, and the total.',
      'When you pay: the payment screenshot you upload. We do not collect card numbers, UPI PINs, bank credentials or any payment instrument details &mdash; the payment happens entirely in your own UPI app, outside this website.'
    ]
  },
  {
    heading: 'YOUR PAYMENT SCREENSHOT',
    paragraphs: [
      'A payment screenshot can show your name, bank or UPI handle, an amount and a transaction reference, so it is treated as confidential.'
    ],
    bullets: [
      'It is stored in a private storage bucket. There is no public link, and it cannot be opened by guessing a URL.',
      'Only you and the organisers verifying payments can view it. Access is granted through short-lived signed links, not permanent addresses.',
      'Only JPG, JPEG and PNG images are accepted, up to 5 MB. Files are checked by inspecting their actual contents, not by trusting the filename.',
      'Images are resized before storage, so no more detail is retained than a person needs to read the transaction.'
    ]
  },
  {
    heading: 'WHY WE USE IT',
    bullets: [
      'To verify that you are eligible to attend and that your payment was made.',
      'To issue your Delegate ID and confirm your event registrations.',
      'To manage limited seats fairly and prevent duplicate registrations.',
      'To contact you about the events you registered for.'
    ],
    paragraphs: [
      'We do not sell your data, we do not share it with advertisers, and we do not use it to profile you. This site runs no advertising and no third-party analytics or tracking scripts.'
    ]
  },
  {
    heading: 'WHO CAN SEE YOUR DATA',
    bullets: [
      'You can see your own registrations, orders and payment proof at any time while signed in.',
      'Authorised members of the STRIATUM 4.0 organising committee can see delegate applications and payment proofs, because a person has to verify each payment by hand.',
      'Nobody else. The database enforces this per account, so one delegate cannot read another delegate&rsquo;s records.'
    ]
  },
  {
    heading: 'WHERE IT IS STORED',
    paragraphs: [
      'Registration data and payment screenshots are held in a Supabase (PostgreSQL) database hosted in Mumbai, India. Sign-in is handled by Supabase Auth using Google&rsquo;s identity service. Your browser also keeps a small amount of information locally &mdash; your cart and your signed-in session &mdash; which you can clear by clearing your browser data.'
    ]
  },
  {
    heading: 'HOW LONG WE KEEP IT',
    paragraphs: [
      'Registration records are kept for the symposium and for a reasonable period afterwards, so that attendance, certificates and prize records can be confirmed. Payment screenshots are kept only as long as needed to verify and account for payments. If you want your data removed sooner, write to us at the address below; we will honour requests except where a record must be retained to resolve a payment or an award.'
    ]
  },
  {
    heading: 'YOUR CHOICES',
    bullets: [
      'You can ask for a copy of the data we hold about you.',
      'You can ask us to correct anything inaccurate.',
      'You can ask us to delete your account and its data, subject to the retention note above.',
      'You can withdraw a Delegate Pass application before it is approved.'
    ]
  },
  {
    heading: 'CHILDREN',
    paragraphs: [
      'This site is intended for students in medical and allied health programmes, and for organisers. It is not directed at children. The BIOVERSE exhibition welcomes school students, but that is an in-person exhibition &mdash; no school student is asked to create an account here.'
    ]
  },
  {
    heading: 'CHANGES',
    paragraphs: [
      'If this policy changes materially before the symposium, the updated date at the top of this page will change. Continuing to use the site after a change means you accept the updated policy.'
    ]
  },
  {
    heading: 'CONTACT',
    paragraphs: [
      'For any question about your data, or to make a request under this policy, write to ' +
        ORGANISER_EMAIL +
        ' with the subject line &ldquo;Privacy request&rdquo;.'
    ]
  }
];

const TERMS: Clause[] = [
  {
    heading: 'WHAT THIS COVERS',
    paragraphs: [
      'These terms apply to registration for STRIATUM 4.0, the medical symposium of IGMCRI, Puducherry, presented by SIGMA 2026. By creating an account and registering, you accept them.'
    ]
  },
  {
    heading: 'WHO CAN REGISTER',
    bullets: [
      'Students of MBBS, dentistry, allied health sciences, biomedical sciences, pharmacy, nursing and physiotherapy programmes, and interns (CRRI), as specified for each event.',
      'Individual events set their own eligibility &mdash; year of study, team size and similar. The eligibility shown on each event&rsquo;s page is the one that applies.',
      'You must register with your own details. Registering on behalf of someone else, or with details that are not yours, may result in cancellation.'
    ]
  },
  {
    heading: 'DELEGATE PASS',
    bullets: [
      'A Delegate Pass is required for all workshops.',
      'THE MEDICAL VAULT and MEDMAZE do not require a Delegate Pass.',
      'THE DIAGNOSTIC ABYSS and CORAL CANVAS do not require a Delegate Pass for abstract submission.',
      'Applying for a Delegate Pass does not activate it. Every application is verified by hand, and your Delegate ID is issued only after an organiser approves it.'
    ]
  },
  {
    heading: 'REGISTRATION AND SEATS',
    bullets: [
      'Several workshops have a fixed number of seats. Seats are allotted first come, first served.',
      'A seat is held while your payment is awaiting verification, and is confirmed only once that payment is approved.',
      'You cannot register twice for the same event.',
      'If an event fills or closes before your payment is verified, the organisers will contact you.'
    ]
  },
  {
    heading: 'FEES AND PAYMENT',
    bullets: [
      'Fees are shown on each event page and again in your cart before you pay. The amount shown at checkout is the amount payable.',
      'Payment is made directly from your own UPI application to the symposium account. This website does not process payments and never handles your card, bank or UPI credentials.',
      'After paying, you upload a screenshot of the transaction. Your registration stays pending until an organiser verifies it.',
      'If a screenshot is unclear, shows a different amount, or cannot be matched to a payment, it will be sent back to you for re-upload with the reason given. Your selected events are preserved &mdash; you will not have to choose them again.',
      'Submitting a screenshot for a payment you did not make, or altering a screenshot, will result in cancellation of your registration.'
    ]
  },
  {
    heading: 'CANCELLATION AND REFUNDS',
    paragraphs: [
      'The organisers have not published a refund policy for STRIATUM 4.0, and this website does not process refunds automatically. If you need to cancel or request a refund, write to ' +
        ORGANISER_EMAIL +
        ' before the event. Any decision rests with the organising committee.'
    ]
  },
  {
    heading: 'EVENT RULES',
    bullets: [
      'Rules specific to each event &mdash; team composition, submission formats, deadlines and presentation limits &mdash; are published on that event&rsquo;s page and form part of these terms.',
      'Work you submit must be your own. Plagiarism, fabricated data or academic misconduct will result in disqualification.',
      'Deadlines for abstracts and submissions are as published. Late entries may not be considered.',
      'In every competitive event, the decision of the judges or quiz master is final.',
      'Mobile phones and outside assistance are prohibited in events where the rules say so.'
    ]
  },
  {
    heading: 'ACCOMMODATION',
    bullets: [
      'Paid accommodation is available to registered delegates at ₹500 per person per day, arranged within or outside the college campus.',
      'Rooms and beds are allotted first come, first served.',
      'The organisers are not responsible for loss of or damage to valuables, luggage or personal belongings.',
      'Smoking, alcohol and narcotic substances are strictly prohibited, and a violation may result in immediate cancellation of accommodation.',
      'Delegates are liable for damage caused to accommodation property.'
    ]
  },
  {
    heading: 'CONDUCT',
    paragraphs: [
      'Delegates are expected to behave professionally towards fellow participants, faculty, organisers and hospital staff, and to respect patient confidentiality at all times. The organisers may remove a delegate from an event or from the venue for misconduct.'
    ]
  },
  {
    heading: 'PROGRAMME CHANGES',
    paragraphs: [
      'The organisers may change the schedule, venue, faculty or format of an event where circumstances require it. Where an event has no published date or time yet, that information will appear on this site once it is confirmed. We do not display provisional dates as though they were final.'
    ]
  },
  {
    heading: 'YOUR ACCOUNT',
    bullets: [
      'Keep your sign-in method secure. Anyone with access to your email or Google account can access your registration.',
      'Delegate IDs are personal and non-transferable.',
      'Do not attempt to access other delegates&rsquo; records, or to interfere with the site&rsquo;s operation.'
    ]
  },
  {
    heading: 'LIABILITY',
    paragraphs: [
      'The organisers take reasonable care in running the symposium and this website, but are not liable for indirect loss, for events beyond their reasonable control, or for personal belongings. Nothing here limits liability that cannot be limited by law.'
    ]
  },
  {
    heading: 'CONTACT',
    paragraphs: [
      'Questions about registration, payment or these terms should go to ' + ORGANISER_EMAIL + '.'
    ]
  }
];

function renderClauses(clauses: Clause[]): string {
  return clauses
    .map(
      (clause, index) => `
      <section class="legal-clause">
        <div class="legal-clause-index">${String(index + 1).padStart(2, '0')}</div>
        <div class="legal-clause-body">
          <h2 class="legal-clause-heading">${clause.heading}</h2>
          ${(clause.paragraphs ?? []).map(p => `<p class="legal-paragraph">${p}</p>`).join('')}
          ${
            clause.bullets?.length
              ? `<ul class="legal-bullets">
                  ${clause.bullets
                    .map(b => `<li><span class="legal-bullet-node"></span><span>${b}</span></li>`)
                    .join('')}
                </ul>`
              : ''
          }
        </div>
      </section>`
    )
    .join('');
}

function renderLegalPage(kind: 'privacy' | 'terms'): string {
  const isPrivacy = kind === 'privacy';
  const clauses = isPrivacy ? PRIVACY : TERMS;

  return `
    <div class="screen-content no-bottom-nav legal-screen">

      <header class="details-top-header">
        <button class="btn-back-nav" id="btn-legal-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span class="back-nav-label">BACK</span>
        </button>

        <div class="details-brand-sig">
          <div class="sig-striatum">STRIATUM <span class="cyan-text">4.0</span></div>
          <div class="sig-inst">IGMCRI · SIGMA 2026</div>
        </div>
      </header>

      <section class="explore-hero-section legal-hero">
        <div class="section-index-label" style="margin-bottom: 4px;">
          <span class="cyan-num">${isPrivacy ? '01' : '02'}</span>
          <span class="slash">/</span>
          <span class="section-name">${isPrivacy ? 'PRIVACY' : 'TERMS'}</span>
        </div>

        <h1 class="explore-heading">
          ${isPrivacy ? 'Your data,<br />handled plainly' : 'Registration<br />terms'}<span class="cyan-period">.</span>
        </h1>

        <p class="explore-subtitle">
          ${
            isPrivacy
              ? 'What this site collects, why, and who can see it.'
              : 'What you agree to when you register for STRIATUM 4.0.'
          }
        </p>

        <div class="legal-updated">LAST UPDATED · ${LEGAL_LAST_UPDATED.toUpperCase()}</div>
      </section>

      <div class="legal-body">
        <div class="legal-rail"></div>
        ${renderClauses(clauses)}
      </div>

      <div class="legal-crosslink">
        <button class="action-link-cyan" id="btn-legal-switch">
          <span>${isPrivacy ? 'READ THE REGISTRATION TERMS' : 'READ THE PRIVACY POLICY'}</span>
          <span>→</span>
        </button>
      </div>

      <footer class="details-footer">
        <div class="footer-left-meta">
          <span class="symp-name">STRIATUM 4.0</span>
          <span class="symp-sub">IGMCRI · SIGMA 2026</span>
          <span class="footer-dash-line"></span>
        </div>
        <div class="footer-right-sig">
          <span>A FAMILIAR JOURNEY.</span>
          <span class="cyan-text">A DEEPER DIVE.</span>
          <span class="footer-dash-line" style="margin-left: auto;"></span>
        </div>
      </footer>

    </div>
  `;
}

export function renderPrivacyView(): string {
  return renderLegalPage('privacy');
}

export function renderTermsView(): string {
  return renderLegalPage('terms');
}

function attachLegalEvents(current: 'privacy' | 'terms'): void {
  document.getElementById('btn-legal-back')?.addEventListener('click', () => {
    appStore.goBackFromLegal();
  });

  document.getElementById('btn-legal-switch')?.addEventListener('click', () => {
    appStore.setScreen(current === 'privacy' ? 'terms' : 'privacy');
  });
}

export function attachPrivacyEvents(): void {
  attachLegalEvents('privacy');
}

export function attachTermsEvents(): void {
  attachLegalEvents('terms');
}
