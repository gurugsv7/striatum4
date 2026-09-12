/**
 * STRIATUM 4.0 — Events 14–26 (Academic Presentations + Innovation/Research/Creative/Games).
 *
 * Sourced exclusively from STRIATUM_4.0_Website_Event_Master_Data.md. See eventTypes.ts
 * for the "never invent a fact" rule: fields the brochure omits are simply left out.
 */

import { SymposiumEvent } from './eventTypes.ts';

export const EVENTS_PART_2: SymposiumEvent[] = [
  // 14. LUMINARA
  {
    id: 's4-14',
    code: 'S4 / 14',
    name: 'LUMINARA',
    tagline: 'Explore. Engage. Evolve.',
    summary: 'A multi-domain symposium where MBBS teams present original work before faculty judges.',
    description:
      'LUMINARA is STRIATUM 4.0\'s flagship symposium, inviting MBBS students and CRRIs to explore, engage and evolve across General Medicine, Obstetrics & Gynaecology, Ophthalmology, Biochemistry, Physiology and Pathology. Shortlisted teams present their work offline before a panel of faculty judges.',
    category: 'presentation',
    specialties: ['General Medicine', 'Obstetrics & Gynaecology', 'Ophthalmology', 'Biochemistry', 'Physiology', 'Pathology'],
    format: 'Symposium',
    participation: 'team',
    teamSize: { min: 2, max: 6 },
    pricing: { team: 400, unit: 'per_team' },
    delegatePassRequirement: 'unspecified',
    eligibility: [
      'MBBS students',
      'CRRIs (2022 batch)',
      'All team members must belong to the same institution/college.'
    ],
    rules: [
      'Work must be original and plagiarism-free.',
      'Academic misconduct may lead to disqualification.',
      'Judges\' decision is final.'
    ],
    abstractDeadline: '3 October 2026',
    submissionEmail: 'striatum04@gmail.com',
    submissionInstructions: [
      'Maximum 500 words',
      '.doc or .docx',
      'Clear and structured format',
      'Filename: name_subject_luminara',
      'Email: striatum04@gmail.com',
      'Deadline: 3 October 2026'
    ],
    prizes: { totalValue: 4000 },
    coordinators: [{ name: 'Sameera' }, { name: 'Narmadha' }],
    sections: [
      {
        title: 'ELIGIBILITY',
        defaultOpen: true,
        items: [
          'MBBS students',
          'CRRIs (2022 batch)',
          'All team members must belong to the same institution/college.'
        ]
      },
      {
        title: 'ABSTRACT GUIDELINES',
        items: ['Maximum 500 words', '.doc or .docx', 'Clear and structured format']
      },
      {
        title: 'SUBMISSION',
        items: ['Filename: name_subject_luminara', 'Email: striatum04@gmail.com', 'Deadline: 3 October 2026']
      },
      {
        title: 'SELECTION PROCESS',
        items: ['Shortlisted teams are to be announced through Instagram and informed by WhatsApp or email.']
      },
      {
        title: 'FINAL PRESENTATION',
        items: [
          'Shortlisted teams present offline before faculty judges.',
          'Format: PowerPoint or prototype/model.',
          'Duration: 10–15 minutes including Q&A.',
          'Presentation time limits must be followed.'
        ]
      },
      {
        title: 'RULES',
        items: [
          'Work must be original and plagiarism-free.',
          'Academic misconduct may lead to disqualification.',
          'Judges\' decision is final.'
        ]
      },
      { title: 'PRIZES', facts: [{ label: 'Prize Pool', value: '₹4,000' }] },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: '₹400 per team' },
          { label: 'Team size', value: '2–6' },
          { label: 'Prize pool', value: '₹4,000' },
          { label: 'Abstract deadline', value: '3 October 2026' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['symposium', 'presentation']
  },

  // 15. THE DIAGNOSTIC ABYSS
  {
    id: 's4-15',
    code: 'S4 / 15',
    name: 'THE DIAGNOSTIC ABYSS',
    summary: 'A case presentation event covering Medicine, Obstetrics & Gynaecology, Paediatrics and Surgery.',
    description:
      'THE DIAGNOSTIC ABYSS invites individuals or teams of two to present original clinical cases drawn from teaching hospitals affiliated with their college, across Medicine, Obstetrics & Gynaecology, Paediatrics and Surgery.',
    category: 'presentation',
    specialties: ['Medicine', 'Obstetrics & Gynaecology', 'Paediatrics', 'Surgery'],
    format: 'Case Presentation',
    participation: 'either',
    teamSize: { min: 1, max: 2 },
    pricing: { individual: 300, team: 400 },
    delegatePassRequirement: 'not_required_for_submission',
    rules: [
      'Only one delegate from a team presents.',
      'Either team member may answer questions.',
      'Case must be original.',
      'Case must come from a teaching hospital affiliated with the participant\'s college.',
      'Case must have been followed up.',
      'Participant must provide a letter confirming the case belongs to the hospital, signed by the HOD.'
    ],
    abstractDeadline: '3 October 2026',
    submissionDeadline: '10 October 2026',
    submissionEmail: 'striatum04@gmail.com',
    submissionInstructions: [
      'Maximum 500 words covering: brief history, salient examination findings, provisional diagnosis, differential diagnosis, investigations, final diagnosis, management',
      'Email: striatum04@gmail.com',
      'Filename: name_subject_diagnosticabyss'
    ],
    prizes: { totalValue: 3000, notes: 'One winner for each category, announced during the valedictory ceremony.' },
    coordinators: [{ name: 'Lakshmi Sree' }, { name: 'Lakshana' }],
    sections: [
      {
        title: 'ELIGIBILITY',
        defaultOpen: true,
        items: ['Medicine', 'Obstetrics & Gynaecology', 'Paediatrics', 'Surgery']
      },
      {
        title: 'ABSTRACT GUIDELINES',
        items: [
          'Maximum 500 words covering:',
          'Brief history',
          'Salient examination findings',
          'Provisional diagnosis',
          'Differential diagnosis',
          'Investigations',
          'Final diagnosis',
          'Management'
        ]
      },
      {
        title: 'SUBMISSION',
        items: ['Email: striatum04@gmail.com', 'Filename: name_subject_diagnosticabyss', 'Abstract deadline: 3 October 2026']
      },
      {
        title: 'SELECTION PROCESS',
        items: [
          'Selected delegates will be announced through @igmc._.striatum_offical and informed by email.',
          'Final presentation is expected as .ppt or .pptx.'
        ]
      },
      {
        title: 'RULES',
        items: [
          'Only one delegate from a team presents.',
          'Either team member may answer questions.',
          'Case must be original.',
          'Case must come from a teaching hospital affiliated with the participant\'s college.',
          'Case must have been followed up.',
          'Participant must provide a letter confirming the case belongs to the hospital, signed by the HOD.'
        ]
      },
      {
        title: 'PRIZES',
        facts: [{ label: 'Prize Pool', value: '₹3,000' }],
        body: 'One winner for each category, announced during the valedictory ceremony.'
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: 'Individual ₹300 / Team of 2 ₹400' },
          { label: 'Team size', value: '1–2' },
          { label: 'Prize pool', value: '₹3,000' },
          { label: 'Abstract deadline', value: '3 October 2026' },
          { label: 'Submission deadline', value: '10 October 2026' },
          { label: 'Delegate Pass', value: 'Not required for abstract submission' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['case presentation', 'case', 'clinical']
  },

  // 16. CORAL CANVAS
  {
    id: 's4-16',
    code: 'S4 / 16',
    name: 'CORAL CANVAS',
    summary: 'A poster presentation event judged on clarity, content and presentation skill.',
    description:
      'CORAL CANVAS invites individuals or teams of two to submit e-posters, with selected teams presenting and defending their work before a jury on event day.',
    category: 'presentation',
    specialties: ['Medical Research'],
    format: 'Poster Presentation',
    participation: 'either',
    teamSize: { min: 1, max: 2 },
    pricing: { individual: 300, team: 400 },
    delegatePassRequirement: 'not_required_for_submission',
    rules: [
      'Only one delegate from a team presents.',
      'Either team member can answer questions.',
      'Plagiarism leads to disqualification.',
      'Selected teams present on event day.'
    ],
    abstractDeadline: '3 October 2026',
    submissionDeadline: '10 October 2026',
    submissionEmail: 'striatum04@gmail.com',
    submissionInstructions: [
      'E-posters must be submitted to striatum04@gmail.com.',
      'Filename: Name_Coral Canvas',
      'All information must fit on one slide.'
    ],
    prizes: {
      totalValue: 3000,
      notes: 'Awards: Overall best poster presentation, Best poster, Best presenter. Winners announced during the valedictory ceremony.'
    },
    coordinators: [{ name: 'Lavanya' }, { name: 'Padhmajaa' }],
    needsConfirmation: [
      'Poster specification contradiction: the brochure simultaneously states digital posters "in print," landscape orientation, maximum 4 ft × 3 ft, and 1080×1920 resolution (which is portrait). These conflict, so no poster dimension/orientation/resolution is published pending organiser confirmation.'
    ],
    sections: [
      {
        title: 'SUBMISSION',
        defaultOpen: true,
        items: [
          'E-posters must be submitted to striatum04@gmail.com.',
          'Filename: Name_Coral Canvas',
          'All information must fit on one slide.',
          'Deadline: 10 October 2026'
        ]
      },
      {
        title: 'FINAL PRESENTATION',
        items: ['Total: 7 minutes', 'Poster explanation: 4 minutes', 'Jury Q&A: 3 minutes']
      },
      {
        title: 'RULES',
        items: [
          'Only one delegate from a team presents.',
          'Either team member can answer questions.',
          'Plagiarism leads to disqualification.',
          'Selected teams present on event day.'
        ]
      },
      {
        title: 'PRIZES',
        facts: [{ label: 'Prize Pool', value: '₹3,000' }],
        items: ['Overall best poster presentation', 'Best poster', 'Best presenter'],
        body: 'Winners announced during the valedictory ceremony.'
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: 'Individual ₹300 / Team of 2 ₹400' },
          { label: 'Team size', value: '1–2' },
          { label: 'Prize pool', value: '₹3,000' },
          { label: 'Abstract submission date', value: '3 October 2026' },
          { label: 'E-poster deadline', value: '10 October 2026' },
          { label: 'Delegate Pass', value: 'Not required for abstract submission' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['poster', 'eposter', 'presentation']
  },

  // 17. CHIRONEX
  {
    id: 's4-17',
    code: 'S4 / 17',
    name: 'CHIRONEX',
    summary: 'A paper presentation event for original research, screened by a faculty committee.',
    description:
      'CHIRONEX invites individuals or teams of two to submit research abstracts. Abstracts are screened by a committee of senior faculty, and top submissions advance to oral presentation.',
    category: 'presentation',
    specialties: ['Medical Research'],
    format: 'Paper Presentation',
    participation: 'either',
    teamSize: { min: 1, max: 2 },
    pricing: { individual: 300, team: 400 },
    delegatePassRequirement: 'unspecified',
    rules: ['One delegate from the team presents.', 'Either member may answer questions.'],
    abstractDeadline: '2 October 2026',
    submissionEmail: 'striatum04@gmail.com',
    submissionInstructions: [
      'Abstract must not exceed 500 words.',
      'Submit as .doc or .docx.',
      'Filename: Name_chironex',
      'Email: striatum04@gmail.com'
    ],
    prizes: { totalValue: 3000 },
    coordinators: [{ name: 'Harikrishna' }, { name: 'Abinaya' }],
    needsConfirmation: [
      'The brochure states the final PowerPoint must be submitted by 18 October 2026, which appears unusually late and is unverified; it is not published as a submission deadline pending organiser confirmation.'
    ],
    sections: [
      {
        title: 'ABSTRACT GUIDELINES',
        defaultOpen: true,
        items: [
          'Abstract must not exceed 500 words.',
          'Submit as .doc or .docx.',
          'Format sections: Title, Introduction, Background, Aims and Objectives, Materials and Methods, Results and Analysis (where applicable), References.',
          'When applicable, upload separately: Informed consent form, Study questionnaire, Case-study form.'
        ]
      },
      {
        title: 'SUBMISSION',
        items: ['Filename: Name_chironex', 'Email: striatum04@gmail.com', 'Abstract deadline: 2 October 2026']
      },
      {
        title: 'SELECTION PROCESS',
        items: [
          'Abstracts are screened by a committee of senior faculty members.',
          'The screening committee selects the top abstracts for oral presentation, and its decision is final.'
        ]
      },
      {
        title: 'FINAL PRESENTATION',
        items: [
          'Format: PowerPoint',
          'Total duration: 8 minutes',
          'Presentation: 5 minutes',
          'Q&A: 3 minutes',
          'Winners announced during the valedictory ceremony.'
        ]
      },
      { title: 'RULES', items: ['One delegate from the team presents.', 'Either member may answer questions.'] },
      { title: 'PRIZES', facts: [{ label: 'Prize Pool', value: '₹3,000' }] },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: 'Individual ₹300 / Team of 2 ₹400' },
          { label: 'Team size', value: '1–2' },
          { label: 'Prize pool', value: '₹3,000' },
          { label: 'Abstract deadline', value: '2 October 2026' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['paper', 'paper presentation', 'abstract', 'research']
  },

  // 18. NEURONOVA
  {
    id: 's4-18',
    code: 'S4 / 18',
    name: 'NEURONOVA',
    tagline: 'Where Ideas Ignite',
    summary: 'A healthcare innovation ideathon for medical devices, digital health and AI solutions.',
    description:
      'NEURONOVA is an interdisciplinary ideathon open to MBBS, Dentistry, Allied Health Sciences, Biomedical Sciences, Pharmacy, Nursing and Physiotherapy students, inviting ideas across medical devices, diagnostic tools, digital health, apps, AI, telemedicine and affordable healthcare solutions.',
    category: 'innovation',
    specialties: ['Healthcare Innovation'],
    format: 'Ideathon',
    date: '18 OCT',
    isoDate: '2026-10-18',
    startTime: '9:00 AM',
    participation: 'either',
    teamSize: { min: 1, max: 3 },
    pricing: { team: 500, unit: 'per_team', note: 'Payable after abstract selection. Initial abstract submission is free.' },
    delegatePassRequirement: 'unspecified',
    eligibility: [
      'MBBS — first year through CRRI',
      'Dentistry',
      'Allied Health Sciences',
      'Biomedical Sciences',
      'Pharmacy',
      'Nursing',
      'Physiotherapy',
      'Interdisciplinary teams are encouraged.'
    ],
    rules: [
      'Original ideas only.',
      'No plagiarism.',
      'Report at least 15 minutes before the event.',
      'Judges\' decision is final.'
    ],
    abstractDeadline: '3 October 2026',
    submissionInstructions: [
      'Submit as PDF with: Title of the Innovation; Background/Problem Statement; Statement of Innovation; Description of the Innovation; Methodology/Approach; Expected Outcomes/Impact; Feasibility & Scalability; Keywords (3 to 5).',
      'Also include: participant name, teammate names, college name, college registration number, year of study, course.'
    ],
    prizes: { totalValue: 15000, notes: 'Top 3 ideas receive prizes and certificates. Participation certificates are provided to all presenters.' },
    coordinators: [{ name: 'Esha', phone: '9789821884' }, { name: 'Yuvashri', phone: '6381811767' }],
    needsConfirmation: [
      'Brochure still contains placeholder fields: "Submit your ideas to EMAIL", "Payment Link" and "QR Code for registration". The submission email is intentionally omitted from published content pending organiser confirmation.'
    ],
    sections: [
      {
        title: 'ELIGIBILITY',
        defaultOpen: true,
        items: [
          'MBBS — first year through CRRI',
          'Dentistry',
          'Allied Health Sciences',
          'Biomedical Sciences',
          'Pharmacy',
          'Nursing',
          'Physiotherapy',
          'Interdisciplinary teams are encouraged.'
        ]
      },
      {
        title: 'ABSTRACT GUIDELINES',
        items: [
          'Submit as PDF with:',
          'Title of the Innovation',
          'Background / Problem Statement',
          'Statement of Innovation',
          'Description of the Innovation',
          'Methodology / Approach',
          'Expected Outcomes / Impact',
          'Feasibility & Scalability',
          'Keywords — 3 to 5',
          'Also include: participant name, teammate names, college name, college registration number, year of study, course.'
        ]
      },
      {
        title: 'SUBMISSION',
        items: [
          'Abstract deadline: 3 October 2026',
          'Registration fee ₹500 per team is payable only after abstract selection; initial submission is free.'
        ]
      },
      { title: 'SELECTION PROCESS', items: ['Top 10 abstracts are selected for oral presentation.'] },
      {
        title: 'RULES',
        items: [
          'Original ideas only.',
          'No plagiarism.',
          'Report at least 15 minutes before the event.',
          'Judges\' decision is final.'
        ]
      },
      {
        title: 'PRIZES',
        facts: [{ label: 'Prize Pool', value: '₹15,000' }],
        body: 'Top 3 ideas receive prizes and certificates. Participation certificates are provided to all presenters.'
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '18 October 2026' },
          { label: 'Time', value: '9:00 AM' },
          { label: 'Registration fee', value: '₹500 per team (after abstract selection)' },
          { label: 'Team size', value: '1–3' },
          { label: 'Prize pool', value: '₹15,000' },
          { label: 'Abstract deadline', value: '3 October 2026' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['ideathon', 'innovation', 'startup', 'device', 'ai', 'digital health']
  },

  // 19. THE UNCHARTED
  {
    id: 's4-19',
    code: 'S4 / 19',
    name: 'THE UNCHARTED',
    tagline: 'Think beyond the obvious, Research beyond the known.',
    summary: 'An individual research idea pitch judged on originality and clarity.',
    description:
      'THE UNCHARTED invites individual participants to pitch an original research idea in a maximum of three slides, followed by a live Q&A with judges.',
    category: 'research',
    specialties: ['Medical Research'],
    format: 'Research Idea Pitch',
    participation: 'individual',
    pricing: { flat: 300, unit: 'per_person' },
    delegatePassRequirement: 'unspecified',
    rules: [
      'Plagiarism leads to disqualification.',
      'Fabricated data leads to disqualification.',
      'Judges\' decision is final.'
    ],
    abstractDeadline: '3 October 2026',
    submissionEmail: 'striatum04@gmail.com',
    submissionInstructions: ['Maximum 500 words', '.doc or .docx', 'Email: striatum04@gmail.com', 'Filename: NAME_SUBJECT_THEUNCHARTED'],
    prizes: { totalValue: 4000 },
    coordinators: [{ name: 'Shanmathi', phone: '9176680741' }, { name: 'Pooja', phone: '9345408760' }],
    sections: [
      { title: 'ABSTRACT GUIDELINES', defaultOpen: true, items: ['Maximum 500 words', '.doc or .docx'] },
      {
        title: 'SUBMISSION',
        items: ['Email: striatum04@gmail.com', 'Filename: NAME_SUBJECT_THEUNCHARTED', 'Deadline: 3 October 2026']
      },
      {
        title: 'FINAL PRESENTATION',
        items: ['Maximum 3 slides', 'Duration: 5–8 minutes', 'Q&A after presentation']
      },
      {
        title: 'RULES',
        items: ['Plagiarism leads to disqualification.', 'Fabricated data leads to disqualification.', 'Judges\' decision is final.']
      },
      { title: 'PRIZES', facts: [{ label: 'Prize Pool', value: '₹4,000' }] },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: '₹300 per person' },
          { label: 'Prize pool', value: '₹4,000' },
          { label: 'Abstract deadline', value: '3 October 2026' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['research pitch', 'idea pitch', 'pitch']
  },

  // 20. LIFE REIMAGINED
  {
    id: 's4-20',
    code: 'S4 / 20',
    name: 'LIFE REIMAGINED',
    summary: 'A medical art event: depict an anatomical structure or physiological function without drawing it directly.',
    description:
      'LIFE REIMAGINED — "Depict the Unseen" — challenges individuals or teams of two to represent an anatomical structure or physiological function through metaphor, symbolism or abstract form, without drawing it directly, within a three-hour session.',
    category: 'creative',
    specialties: ['Fine Arts'],
    format: 'Medical Art',
    participation: 'either',
    teamSize: { min: 1, max: 2 },
    pricing: { flat: 150 },
    delegatePassRequirement: 'unspecified',
    rules: [
      'Reference sketches are allowed.',
      'Internet use during the competition is prohibited.',
      'AI use during the competition is prohibited.',
      'Judges\' decision is final.'
    ],
    prizes: { totalValue: 1500 },
    coordinators: [{ name: 'Jenna Mariam Joji', phone: '7558022834' }, { name: 'Nivetha Balaraman', phone: '6382334788' }],
    sections: [
      {
        title: 'THEME',
        defaultOpen: true,
        body: 'Depict the Unseen — choose an anatomical structure or physiological function and depict it without directly drawing it, using metaphors, symbolism, abstract forms or another indirect visual representation.'
      },
      {
        title: 'SUBMISSION FORMAT',
        items: [
          'Participants must bring their own art supplies, drawing/painting surface and medium.',
          'Duration: maximum 3 hours.',
          'Participants may finish at any point within the three-hour limit.'
        ]
      },
      {
        title: 'RULES',
        items: [
          'Reference sketches are allowed.',
          'Internet use during the competition is prohibited.',
          'AI use during the competition is prohibited.',
          'Judges\' decision is final.'
        ]
      },
      { title: 'JUDGING', items: ['Participants explain their artwork to judges during evaluation.'] },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: '₹150' },
          { label: 'Team size', value: '1–2' },
          { label: 'Prize pool', value: '₹1,500' },
          { label: 'Duration', value: 'Maximum 3 hours' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['medical art', 'fine art', 'art']
  },

  // 21. BEYOND THE BLUE
  {
    id: 's4-21',
    code: 'S4 / 21',
    name: 'BEYOND THE BLUE',
    summary: 'A short film contest for medical and paramedical students.',
    description:
      'BEYOND THE BLUE invites medical and paramedical student teams to tell an original story on film — "Your idea. Your story. Your frame." — with selected entries judged on-site.',
    category: 'creative',
    specialties: ['Film & Media'],
    format: 'Short Film',
    participation: 'team',
    pricing: { team: 500, unit: 'per_team' },
    delegatePassRequirement: 'unspecified',
    eligibility: ['Medical & paramedical students'],
    submissionDeadline: '5 October 2026',
    submissionInstructions: [
      'Duration: 5–10 minutes, including opening and end credits',
      'Aspect ratio: 16:9',
      'Any language permitted; English subtitles required',
      'One entry per team',
      'Submission: online via Google Drive link'
    ],
    prizes: { totalValue: 7000 },
    coordinators: [{ name: 'Adithiyan M', phone: '9500207418' }],
    sections: [
      {
        title: 'THEME',
        defaultOpen: true,
        body: 'Your idea. Your story. Your frame. Take the creative freedom and make it unforgettable.'
      },
      {
        title: 'SUBMISSION FORMAT',
        items: [
          'Duration: 5–10 minutes, including opening and end credits',
          'Aspect ratio: 16:9',
          'Any language permitted; English subtitles required',
          'One entry per team',
          'Submission: online via Google Drive link',
          'Deadline: 5 October 2026'
        ]
      },
      { title: 'JUDGING', items: ['Selected entries judged on-site.'] },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: '₹500 per team' },
          { label: 'Prize pool', value: '₹7,000' },
          { label: 'Submission deadline', value: '5 October 2026' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['short film', 'film', 'video contest']
  },

  // 22. BIOVERSE
  {
    id: 's4-22',
    code: 'S4 / 22',
    name: 'BIOVERSE',
    tagline: 'Beyond Textbooks. Into the World of Medicine.',
    summary: 'A flagship academic exhibition for school students across five interactive medical galleries.',
    description:
      'BIOVERSE invites school students to step beyond textbooks and experience medical science through museums, interactive models and live laboratory demonstrations, spanning Anatomy, Physiology, Biochemistry, Pathology and Community Medicine.',
    category: 'exhibition',
    specialties: ['Medical Education'],
    format: 'Exhibition',
    participation: 'individual',
    pricing: { unspecified: true },
    delegatePassRequirement: 'unspecified',
    sections: [
      {
        title: 'EXHIBITION AREAS',
        defaultOpen: true,
        items: [
          'Anatomy Museum — Where Every Structure Has a Story',
          'Physiology Gallery — Watch Life in Motion',
          'Biochemistry Lab — The Chemistry of Life',
          'Pathology Museum — Read the Silent Language of Disease',
          'Community Medicine Museum — Beyond Hospitals, Into Humanity'
        ]
      },
      {
        title: 'ABOUT',
        body: 'The flagship academic exhibition of STRIATUM 4.0 invites school students to step beyond textbooks and experience medical science through museums, interactive models and live laboratory demonstrations.'
      }
    ],
    status: 'not_registerable',
    registerable: false,
    keywords: ['exhibition', 'museum', 'school students']
  },

  // 23. TIDAL CUTS
  {
    id: 's4-23',
    code: 'S4 / 23',
    name: 'TIDAL CUTS',
    summary: 'An online reel-creation contest — no prompts, no limits, just perspective.',
    description:
      'TIDAL CUTS is an online reel-creation contest for UG MBBS students. With no fixed prompt, entries may cover dance, arts, comedy, awareness or other creative categories, judged on content, creativity, uniqueness and captions.',
    category: 'creative',
    specialties: ['Film & Media'],
    format: 'Reel Creation',
    mode: 'online',
    participation: 'team',
    pricing: { team: 100, unit: 'per_team' },
    delegatePassRequirement: 'unspecified',
    eligibility: ['UG MBBS students'],
    rules: [
      'Content must not be offensive.',
      'No controversial or political issues.',
      'Plagiarism is prohibited.',
      'Judges\' decision is final.'
    ],
    submissionDeadline: '2 October 2026',
    submissionInstructions: [
      'Video duration: 30 seconds – 1 minute',
      'One entry per person',
      'Multiple entries from a college are allowed',
      'Videos are submitted through the provided form link'
    ],
    prizes: { totalValue: 1500 },
    coordinators: [{ name: 'Ram Viswanath Senthil', phone: '7418155363' }, { name: 'Deepavarshini S', phone: '9487449619' }],
    sections: [
      {
        title: 'THEME',
        defaultOpen: true,
        body: 'No prompts. No limits. Just perspective.',
        items: ['Dance', 'Arts', 'Comedy', 'Awareness', 'Other creative categories']
      },
      {
        title: 'SUBMISSION FORMAT',
        items: [
          'Video duration: 30 seconds – 1 minute',
          'One entry per person',
          'Multiple entries from a college are allowed',
          'Videos are submitted through the provided form link',
          'Deadline: 2 October 2026'
        ]
      },
      {
        title: 'RULES',
        items: [
          'Content must not be offensive.',
          'No controversial or political issues.',
          'Plagiarism is prohibited.',
          'Judges\' decision is final.'
        ]
      },
      {
        title: 'JUDGING',
        items: ['Judging is based on content, creativity, uniqueness and captions.', 'Most-liked entry receives a special cash prize.']
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Mode', value: 'Online' },
          { label: 'Registration fee', value: '₹100 per team' },
          { label: 'Prize pool', value: '₹1,500' },
          { label: 'Deadline', value: '2 October 2026' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['reel', 'reel creation', 'video']
  },

  // 24. MEMEVERSE
  {
    id: 's4-24',
    code: 'S4 / 24',
    name: 'MEMEVERSE',
    summary: 'An ophthalmology-themed meme creation contest.',
    description:
      'MEMEVERSE invites students to create medical memes on Ophthalmology, submitted as video, photo or document, with the most-liked and creative entries played on stage on event day.',
    category: 'creative',
    specialties: ['Ophthalmology'],
    format: 'Meme Creation',
    participation: 'team',
    pricing: { team: 50, unit: 'per_team' },
    delegatePassRequirement: 'unspecified',
    rules: ['No controversial or offensive content.', 'Judges\' decision is final.'],
    submissionDeadline: '2 October 2026',
    submissionInstructions: [
      'Maximum 3 entries per person',
      'No restriction on number of entries per college',
      'Meme may be submitted as video, photo or document'
    ],
    prizes: { totalValue: 1000 },
    sections: [
      {
        title: 'THEME',
        defaultOpen: true,
        body: 'Only medical memes/videos related to Ophthalmology are allowed. Video memes are preferred.'
      },
      {
        title: 'SUBMISSION FORMAT',
        items: [
          'Maximum 3 entries per person',
          'No restriction on number of entries per college',
          'Meme may be submitted as video, photo or document',
          'Deadline: 2 October 2026'
        ]
      },
      { title: 'RULES', items: ['No controversial or offensive content.', 'Judges\' decision is final.'] },
      {
        title: 'JUDGING',
        items: [
          'Top 10 most-liked and creative entries are played on stage on event day.',
          'Results are announced on event day.',
          'Most-liked meme receives a special cash prize.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: '₹50 per team' },
          { label: 'Prize pool', value: '₹1,000' },
          { label: 'Deadline', value: '2 October 2026' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['meme', 'ophthalmology']
  },

  // 25. THE MEDICAL VAULT
  {
    id: 's4-25',
    code: 'S4 / 25',
    name: 'THE MEDICAL VAULT',
    tagline: 'Unlock the clues. Escape the unknown.',
    summary: 'A medical mystery room where teams solve puzzles and riddles to escape.',
    description:
      'THE MEDICAL VAULT is a medical mystery-room event: teams of three decipher medical clues, solve puzzles and crack riddles to escape, testing medical knowledge, logical thinking, observation skills and clinical reasoning.',
    category: 'game',
    specialties: ['Clinical Reasoning'],
    format: 'Mystery Room',
    participation: 'team',
    teamSize: { min: 3, max: 3 },
    pricing: { team: 200, unit: 'per_team' },
    delegatePassRequirement: 'not_required',
    rules: [
      'Mobile phones and electronic devices prohibited.',
      'External assistance prohibited.',
      'Misconduct, cheating or rule violations result in immediate disqualification.',
      'Judges\' decision is final.'
    ],
    prizes: { totalValue: 2000 },
    coordinators: [{ name: 'Priya Dharshini', phone: '9150682978' }, { name: 'Purnimasri', phone: '9047355582' }],
    sections: [
      {
        title: 'GAMEPLAY',
        defaultOpen: true,
        body: 'Teams decipher medical clues, solve puzzles and crack riddles to escape the Mystery Room.',
        items: ['Medical knowledge', 'Logical thinking', 'Observation skills', 'Clinical reasoning']
      },
      {
        title: 'RULES',
        items: [
          'Mobile phones and electronic devices prohibited.',
          'External assistance prohibited.',
          'Misconduct, cheating or rule violations result in immediate disqualification.',
          'Judges\' decision is final.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: '₹200 per team' },
          { label: 'Team size', value: '3' },
          { label: 'Registration tier', value: 'Tier 2 required' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['escape room', 'mystery', 'puzzle']
  },

  // 26. MEDMAZE
  {
    id: 's4-26',
    code: 'S4 / 26',
    name: 'MEDMAZE',
    tagline: 'Find the clues. Claim the treasure.',
    summary: 'A medical-themed treasure hunt where every clue leads deeper into the challenge.',
    description:
      'MEDMAZE is a medical treasure hunt: teams of three solve clues and complete challenges at each stage to reach the final treasure, staying together throughout the hunt. Tier 2 registration is required. Winners will receive exciting cash prizes and gifts.',
    category: 'game',
    specialties: ['Clinical Reasoning'],
    format: 'Treasure Hunt',
    participation: 'team',
    teamSize: { min: 3, max: 3 },
    pricing: { team: 200, unit: 'per_team' },
    delegatePassRequirement: 'required',
    rules: [
      'Teams must follow instructions to proceed to each next clue.',
      'Mobile phones and electronic devices are prohibited.',
      'External assistance is prohibited.',
      'Cheating, clue tampering or misconduct results in immediate disqualification.',
      'All team members must remain together throughout the hunt.',
      'The first team to reach the final treasure while following all rules wins.'
    ],
    prizes: { totalValue: 0 },
    coordinators: [{ name: 'Kabila Barathi', phone: '9042461697' }, { name: 'Atheethi', phone: '9944858040' }],
    sections: [
      {
        title: 'GAMEPLAY',
        defaultOpen: true,
        body: 'Teams solve clues and complete challenges at each stage to reach the final treasure.'
      },
      {
        title: 'RULES',
        items: [
          'Teams must follow instructions to proceed to each next clue.',
          'Mobile phones and electronic devices are prohibited.',
          'External assistance is prohibited.',
          'Cheating, clue tampering or misconduct results in immediate disqualification.',
          'All team members must remain together throughout the hunt.',
          'The first team to reach the final treasure while following all rules wins.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Registration fee', value: '₹200 per team' },
          { label: 'Team size', value: '3' },
          { label: 'Prize pool', value: '₹2,000' },
          { label: 'Delegate Pass', value: 'Not required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['treasure hunt', 'hunt', 'clues']
  }
];
