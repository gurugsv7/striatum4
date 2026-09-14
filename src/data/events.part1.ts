/**
 * STRIATUM 4.0 — Events 1–13 (Workshops 1–10, Quizzes 11–13).
 *
 * Sourced exclusively from STRIATUM_4.0_Website_Event_Master_Data.md.
 * Never invent a fact: a field the brochure does not state is simply omitted.
 *
 * WARNING — this file is not the last word. events.ts applies
 * LATEST_BROCHURE_OVERRIDES on top of everything here, so several entries below
 * are stale on purpose: SUTUREX is renamed and redated to STITCHREEF, and other
 * dates and coordinators are corrected there too. Editing a value here that the
 * override layer also sets will appear to do nothing.
 *
 * Change it in events.ts, or fold the overrides back into these files once the
 * organisers' final details are settled.
 */

import { SymposiumEvent } from './eventTypes.ts';

export const EVENTS_PART_1: SymposiumEvent[] = [
  // ---------------------------------------------------------------------
  // 1. THE SONO EDGE
  // ---------------------------------------------------------------------
  {
    id: 's4-01',
    code: 'S4 / 01',
    name: 'THE SONO EDGE',
    tagline: 'Precision Starts with a Scan',
    summary:
      'A hands-on POCUS workshop in ultrasound-guided anaesthesia and critical care assessment.',
    description:
      'Point-of-care ultrasound is transforming Anaesthesiology, Critical Care and Pain Medicine. THE SONO EDGE combines focused assessment with practical, hands-on learning in bedside ultrasound, covering sonography basics and its applications in critical care.',
    category: 'workshop',
    specialties: ['Anaesthesiology', 'Critical Care', 'POCUS'],
    format: 'Workshop',
    date: '15 OCT',
    isoDate: '2026-10-15',
    startTime: '8:30 AM',
    endTime: '4:00 PM',
    slots: 40,
    participation: 'individual',
    pricing: { earlyBird: 1200, lateBird: 1400, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Introduction to sonography and its applications in critical care',
      'Approach to a patient with breathlessness',
      'Approach to a patient with blunt trauma',
      'Approach to a patient with hypotension',
      'Visualisation of neurovascular bundles',
      'Approach to a patient with difficult intravenous access'
    ],
    coordinators: [{ name: 'Sivashankar V.' }, { name: 'Sanjai S.' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Introduction to sonography and its applications in critical care',
          'Approach to a patient with breathlessness',
          'Approach to a patient with blunt trauma',
          'Approach to a patient with hypotension',
          'Visualisation of neurovascular bundles',
          'Approach to a patient with difficult intravenous access'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 40 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '15 October 2026' },
          { label: 'Time', value: '8:30 AM – 4:00 PM' },
          { label: 'Slots', value: '40' },
          { label: 'Early Bird', value: '₹1,200' },
          { label: 'Late Bird', value: '₹1,400' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['pocus', 'ultrasound', 'usg', 'sonography', 'icu', 'anaesthesia', 'critical care']
  },

  // ---------------------------------------------------------------------
  // 2. SUTUREX
  // ---------------------------------------------------------------------
  {
    id: 's4-02',
    code: 'S4 / 02',
    name: 'SUTUREX',
    tagline: 'Precision in Every Direction',
    summary:
      'A practical surgical-skills workshop on suturing, hand-knotting and operation-theatre etiquette.',
    description:
      'A practical surgical-skills workshop focused on precision, control, dexterity and essential operation-theatre practices, covering basic suturing, hand-knotting techniques, scrubbing, gowning and gloving.',
    category: 'workshop',
    specialties: ['Surgery'],
    format: 'Workshop',
    date: '17 OCT',
    isoDate: '2026-10-17',
    startTime: '8:30 AM',
    endTime: '12:30 PM',
    slots: 50,
    participation: 'individual',
    pricing: { earlyBird: 1200, lateBird: 1400, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Universal precautions',
      'Basic suturing skills',
      'Hand-knotting techniques',
      'Operation theatre etiquette',
      'Patient preparation',
      'Hand scrubbing',
      'Gowning and gloving technique'
    ],
    coordinators: [{ name: 'Soniya S.' }, { name: 'Karthikeyan T.' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Universal precautions',
          'Basic suturing skills',
          'Hand-knotting techniques',
          'Operation theatre etiquette',
          'Patient preparation',
          'Hand scrubbing',
          'Gowning and gloving technique'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 50 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '17 October 2026' },
          { label: 'Time', value: '8:30 AM – 12:30 PM' },
          { label: 'Slots', value: '50' },
          { label: 'Early Bird', value: '₹1,200' },
          { label: 'Late Bird', value: '₹1,400' },
          { label: 'Delegate Pass', value: 'Required' },
          { label: 'Included', value: 'Personal suturing kit' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    needsConfirmation: [
      'Brochure description calls this workshop STITCHREEF while the displayed event name is SUTUREX.'
    ],
    keywords: ['suturing', 'stitches', 'knot tying', 'ot', 'operation theatre', 'surgery basics']
  },

  // ---------------------------------------------------------------------
  // 3. PAEDOPRAXIS
  // ---------------------------------------------------------------------
  {
    id: 's4-03',
    code: 'S4 / 03',
    name: 'PAEDOPRAXIS',
    tagline: 'Pedia Skills: Learn, Practice, Master',
    summary:
      'A paediatrics skills workshop covering neonatal resuscitation, IV access and dehydration management.',
    description:
      'A hands-on paediatrics workshop covering anthropometry and developmental assessment, the Neonatal Resuscitation Programme, IV calculations and cannulation, assessment of shock and dehydration, NG tube insertion, oxygen-delivery systems and counselling skills.',
    category: 'workshop',
    specialties: ['Paediatrics'],
    format: 'Workshop',
    date: '16 OCT',
    isoDate: '2026-10-16',
    startTime: '2:00 PM',
    endTime: '4:00 PM',
    slots: 30,
    participation: 'individual',
    pricing: { earlyBird: 800, lateBird: 1000, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Anthropometry interpretation and developmental assessment',
      'NRP — Neonatal Resuscitation Programme',
      'IV calculations',
      'Securing a cannula',
      'Setting an IV drip',
      'Assessment of shock',
      'Signs of dehydration and management',
      'NG tube insertion',
      'Oxygen-delivery systems',
      'Counselling skills'
    ],
    coordinators: [{ name: 'Kiruthiga R.' }, { name: 'Harepriya' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Anthropometry interpretation and developmental assessment',
          'NRP — Neonatal Resuscitation Programme',
          'IV calculations',
          'Securing a cannula',
          'Setting an IV drip',
          'Assessment of shock',
          'Signs of dehydration and management',
          'NG tube insertion',
          'Oxygen-delivery systems',
          'Counselling skills'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 30 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '16 October 2026' },
          { label: 'Time', value: '2:00 PM – 4:00 PM' },
          { label: 'Slots', value: '30' },
          { label: 'Early Bird', value: '₹800' },
          { label: 'Late Bird', value: '₹1,000' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['pediatrics', 'paeds', 'nrp', 'neonatal', 'iv cannula', 'ng tube']
  },

  // ---------------------------------------------------------------------
  // 4. PENUMBRA
  // ---------------------------------------------------------------------
  {
    id: 's4-04',
    code: 'S4 / 04',
    name: 'PENUMBRA',
    tagline: 'Beyond the Visible',
    summary: 'An emergency radiology workshop on E-FAST scanning for trauma assessment.',
    description:
      'A radiology workshop on emergency imaging, covering the indications and limitations of E-FAST, patient and machine preparation, systematic examination technique, and recognition of pathologies through hands-on and clinical simulation practice.',
    category: 'workshop',
    specialties: ['Radiology'],
    format: 'Workshop',
    date: '15 OCT',
    isoDate: '2026-10-15',
    startTime: '9:00 AM',
    endTime: '1:00 PM',
    slots: 40,
    participation: 'individual',
    pricing: { earlyBird: 600, lateBird: 800, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Emergency radiology',
      'Identifying indications and limitations of E-FAST',
      'E-FAST patient and machine preparation',
      'Systematic E-FAST examination sequence',
      'Step-by-step ultrasound technique',
      'Recognition of pathologies',
      'E-FAST interpretation',
      'Algorithm-based decision-making',
      'Hands-on and clinical simulation practice'
    ],
    coordinators: [{ name: 'Keerthana S.' }, { name: 'Harini' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Emergency radiology',
          'Identifying indications and limitations of E-FAST',
          'E-FAST patient and machine preparation',
          'Systematic E-FAST examination sequence',
          'Step-by-step ultrasound technique',
          'Recognition of pathologies',
          'E-FAST interpretation',
          'Algorithm-based decision-making',
          'Hands-on and clinical simulation practice'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 40 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '15 October 2026' },
          { label: 'Time', value: '9:00 AM – 1:00 PM' },
          { label: 'Slots', value: '40' },
          { label: 'Early Bird', value: '₹600' },
          { label: 'Late Bird', value: '₹800' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['efast', 'fast scan', 'emergency radiology', 'trauma imaging', 'ultrasound']
  },

  // ---------------------------------------------------------------------
  // 5. GENESIS
  // ---------------------------------------------------------------------
  {
    id: 's4-05',
    code: 'S4 / 05',
    name: 'GENESIS',
    tagline: 'Where the New Life Begins',
    summary: 'An obstetrics workshop covering labour, delivery and management of obstetric emergencies.',
    description:
      'An obstetrics workshop covering the mechanism and conduct of labour, LSCD, hands-on episiotomy suturing, and management of obstetric emergencies including eclampsia, breech delivery and cord prolapse.',
    category: 'workshop',
    specialties: ['Obstetrics'],
    format: 'Workshop',
    date: '15 OCT',
    isoDate: '2026-10-15',
    startTime: '8:00 AM',
    endTime: '4:00 PM',
    slots: 30,
    participation: 'individual',
    pricing: { earlyBird: 800, lateBird: 1000, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Mechanism and conduct of labour',
      'LSCD',
      'Episiotomy suturing — hands-on',
      'Obstetric emergencies',
      'Eclampsia management',
      'Breech delivery',
      'Cord prolapse'
    ],
    coordinators: [{ name: 'Amudha' }, { name: 'Geedhan' }, { name: 'Jivika L.' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Mechanism and conduct of labour',
          'LSCD',
          'Episiotomy suturing — hands-on',
          'Obstetric emergencies',
          'Eclampsia management',
          'Breech delivery',
          'Cord prolapse'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 30 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '15 October 2026' },
          { label: 'Time', value: '8:00 AM – 4:00 PM' },
          { label: 'Slots', value: '30' },
          { label: 'Early Bird', value: '₹800' },
          { label: 'Late Bird', value: '₹1,000' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['obg', 'obstetrics', 'labour', 'delivery', 'episiotomy', 'eclampsia']
  },

  // ---------------------------------------------------------------------
  // 6. GLOW CODE
  // ---------------------------------------------------------------------
  {
    id: 's4-06',
    code: 'S4 / 06',
    name: 'GLOW CODE',
    tagline: 'Where Intelligence Meets Illumination',
    summary: 'A workshop on applying AI tools across the medical research and protocol-writing process.',
    description:
      'A workshop on applications of AI in medical research, covering prompt engineering for protocol writing, brainstorming research questions, literature review, methodology development, questionnaire and consent-form creation, data analysis and visualisation, and manuscript writing.',
    category: 'workshop',
    specialties: ['Medical Research', 'AI in Medicine'],
    format: 'Workshop',
    date: '17 OCT',
    isoDate: '2026-10-17',
    startTime: '8:30 AM',
    endTime: '4:00 PM',
    slots: 50,
    participation: 'individual',
    pricing: { earlyBird: 600, lateBird: 800, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Prompt engineering in protocol writing',
      'Brainstorming research questions and objectives',
      'Literature review',
      'Developing methodology',
      'Creating questionnaires, proformas and consent forms',
      'Data analysis',
      'Data visualisation',
      'Review and discussion writing',
      'Reference writing',
      'AI-content detection and management'
    ],
    coordinators: [{ name: 'Tharuna S.' }, { name: 'Gugan G.' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Prompt engineering in protocol writing',
          'Brainstorming research questions and objectives',
          'Literature review',
          'Developing methodology',
          'Creating questionnaires, proformas and consent forms',
          'Data analysis',
          'Data visualisation',
          'Review and discussion writing',
          'Reference writing',
          'AI-content detection and management'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 50 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '17 October 2026' },
          { label: 'Time', value: '8:30 AM – 4:00 PM' },
          { label: 'Slots', value: '50' },
          { label: 'Early Bird', value: '₹600' },
          { label: 'Late Bird', value: '₹800' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['ai', 'artificial intelligence', 'research methodology', 'chatgpt', 'protocol writing', 'literature review']
  },

  // ---------------------------------------------------------------------
  // 7. BONEFIRE
  // ---------------------------------------------------------------------
  {
    id: 's4-07',
    code: 'S4 / 07',
    name: 'BONEFIRE',
    tagline: 'The Architecture of Movement',
    summary: 'An orthopaedics workshop on fracture immobilisation, cast application and tendon repair.',
    description:
      'An orthopaedics workshop covering principles of fracture immobilisation, identification and handling of POP materials, splint and cast application, tendon anatomy and biomechanics, and basic tendon-repair techniques through hands-on practical training.',
    category: 'workshop',
    specialties: ['Orthopaedics'],
    format: 'Workshop',
    date: '15 OCT',
    isoDate: '2026-10-15',
    startTime: '8:30 AM',
    endTime: '4:00 PM',
    slots: 50,
    participation: 'individual',
    pricing: { earlyBird: 1300, lateBird: 1500, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Principles of fracture immobilisation',
      'Identification and handling of POP materials',
      'Basic principles of splint and cast application',
      'Positioning and precautions during immobilisation',
      'Tendon anatomy and biomechanics',
      'Principles of tendon repair',
      'Basic tendon-repair techniques',
      'Handling instruments and suture materials',
      'Hands-on practical demonstration and skill training'
    ],
    coordinators: [{ name: 'Gugan M.' }, { name: 'Rathish E. S.' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Principles of fracture immobilisation',
          'Identification and handling of POP materials',
          'Basic principles of splint and cast application',
          'Positioning and precautions during immobilisation',
          'Tendon anatomy and biomechanics',
          'Principles of tendon repair',
          'Basic tendon-repair techniques',
          'Handling instruments and suture materials',
          'Hands-on practical demonstration and skill training'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 50 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '15 October 2026' },
          { label: 'Time', value: '8:30 AM – 4:00 PM' },
          { label: 'Slots', value: '50' },
          { label: 'Early Bird', value: '₹1,300' },
          { label: 'Late Bird', value: '₹1,500' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['ortho', 'bone', 'fracture', 'cast', 'pop', 'tendon']
  },

  // ---------------------------------------------------------------------
  // 8. VITALIS
  // ---------------------------------------------------------------------
  {
    id: 's4-08',
    code: 'S4 / 08',
    name: 'VITALIS',
    tagline: 'When Every Second Matters, Keep Life Moving',
    summary: 'An emergency-medicine trauma workshop with hands-on airway, IV and central line skills on SIMMAN 3G.',
    description:
      'An emergency-medicine workshop on trauma rules and procedures, with hands-on stations for IV lines, airway management, splinting, central venous lines, ICD and E-FAST, using SIMMAN 3G trauma simulators for simulation-based assessment.',
    category: 'workshop',
    specialties: ['Emergency Medicine'],
    format: 'Workshop',
    date: '17 OCT',
    isoDate: '2026-10-17',
    startTime: '8:30 AM',
    endTime: '4:30 PM',
    slots: 30,
    participation: 'individual',
    pricing: { earlyBird: 1800, lateBird: 2000, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Basics of trauma: rules and procedures',
      'Hands-on IV line',
      'Hands-on airway management',
      'Hands-on basic splinting',
      'Hands-on central venous line',
      'Hands-on ICD',
      'E-FAST',
      'Trauma simulators — SIMMAN 3G',
      'Simulation-based assessment'
    ],
    coordinators: [{ name: 'Sajitha B.' }, { name: 'Akash S.' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Basics of trauma: rules and procedures',
          'Hands-on IV line',
          'Hands-on airway management',
          'Hands-on basic splinting',
          'Hands-on central venous line',
          'Hands-on ICD',
          'E-FAST',
          'Trauma simulators — SIMMAN 3G',
          'Simulation-based assessment'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 30 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '17 October 2026' },
          { label: 'Time', value: '8:30 AM – 4:30 PM' },
          { label: 'Slots', value: '30' },
          { label: 'Early Bird', value: '₹1,800' },
          { label: 'Late Bird', value: '₹2,000' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['trauma', 'emergency medicine', 'airway', 'cvl', 'icd', 'simman', 'simulation']
  },

  // ---------------------------------------------------------------------
  // 9. PLEURALIS
  // ---------------------------------------------------------------------
  {
    id: 's4-09',
    code: 'S4 / 09',
    name: 'PLEURALIS',
    tagline: 'Where Breath Meets Precision',
    summary: 'A respiratory-medicine workshop on thoracocentesis, pneumothorax management and oxygen delivery.',
    description:
      'A respiratory-medicine workshop covering thoracocentesis technique, needle decompression for pneumothorax, identification of pneumothorax and pleural effusion, and selection and setup of pleural procedure equipment and oxygen-delivery devices.',
    category: 'workshop',
    specialties: ['Respiratory Medicine'],
    format: 'Workshop',
    date: '15 OCT',
    isoDate: '2026-10-15',
    startTime: '8:00 AM',
    endTime: '12:30 PM',
    slots: 40,
    participation: 'individual',
    pricing: { earlyBird: 600, lateBird: 800, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Thoracocentesis — procedure and technique',
      'Needle decompression for pneumothorax',
      'Identification of pneumothorax and pleural effusion',
      'Selection and handling of pleural procedure equipment',
      'Oxygen-delivery devices — identification and setup',
      'Device selection based on clinical need'
    ],
    coordinators: [{ name: 'Gunasekhar' }, { name: 'Subiksha' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Thoracocentesis — procedure and technique',
          'Needle decompression for pneumothorax',
          'Identification of pneumothorax and pleural effusion',
          'Selection and handling of pleural procedure equipment',
          'Oxygen-delivery devices — identification and setup',
          'Device selection based on clinical need'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 40 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '15 October 2026' },
          { label: 'Time', value: '8:00 AM – 12:30 PM' },
          { label: 'Slots', value: '40' },
          { label: 'Early Bird', value: '₹600' },
          { label: 'Late Bird', value: '₹800' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['pulmonology', 'thoracocentesis', 'pneumothorax', 'pleural effusion', 'chest tube', 'oxygen therapy']
  },

  // ---------------------------------------------------------------------
  // 10. RYTHMICA
  // ---------------------------------------------------------------------
  {
    id: 's4-10',
    code: 'S4 / 10',
    name: 'RYTHMICA',
    tagline: 'Decoding the Electrical Language of the Heart',
    summary: 'A hands-on ECG workshop on 12-lead recording and systematic rhythm interpretation.',
    description:
      'A hands-on ECG workshop covering the principles of cardiac electrical activity, correct 12-lead electrode placement and recording, systematic interpretation of waves, segments and intervals, and case-based recognition of abnormal rhythms.',
    category: 'workshop',
    specialties: ['General Medicine', 'Cardiology'],
    format: 'Workshop',
    date: '16 OCT',
    isoDate: '2026-10-16',
    startTime: '2:00 PM',
    endTime: '4:00 PM',
    slots: 40,
    participation: 'individual',
    pricing: { earlyBird: 600, lateBird: 800, unit: 'per_person' },
    delegatePassRequirement: 'required',
    skills: [
      'Principles of cardiac electrical activity and ECG basics',
      'ECG machine, components and electrodes',
      'Correct 12-lead ECG electrode placement and recording',
      'Interpretation of waves, segments and intervals',
      'Systematic ECG interpretation',
      'Rhythm analysis',
      'Hands-on ECG recording',
      'Case-based recognition of abnormal patterns'
    ],
    coordinators: [{ name: 'Harish' }, { name: 'Ragavendar' }, { name: 'Swetha' }],
    sections: [
      {
        title: 'SKILLS COVERED',
        defaultOpen: true,
        items: [
          'Principles of cardiac electrical activity and ECG basics',
          'ECG machine, components and electrodes',
          'Correct 12-lead ECG electrode placement and recording',
          'Interpretation of waves, segments and intervals',
          'Systematic ECG interpretation',
          'Rhythm analysis',
          'Hands-on ECG recording',
          'Case-based recognition of abnormal patterns'
        ]
      },
      {
        title: 'WHO CAN PARTICIPATE?',
        items: [
          'A valid STRIATUM 4.0 Delegate Pass is required.',
          'Limited to 40 participants.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Date', value: '16 October 2026' },
          { label: 'Time', value: '2:00 PM – 4:00 PM' },
          { label: 'Slots', value: '40' },
          { label: 'Early Bird', value: '₹600' },
          { label: 'Late Bird', value: '₹800' },
          { label: 'Delegate Pass', value: 'Required' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['ecg', 'ekg', 'cardiology', 'heart', 'rhythm']
  },

  // ---------------------------------------------------------------------
  // 11. OCEANIC ODYSSEY
  // ---------------------------------------------------------------------
  {
    id: 's4-11',
    code: 'S4 / 11',
    name: 'OCEANIC ODYSSEY',
    tagline: 'Unravel the clinical mysteries',
    summary: 'A junior-category quiz testing Anatomy and Pharmacology knowledge, for teams of three.',
    description:
      'Are you ready to unravel clinical mysteries? Sharpen your medical acumen, challenge your cognitive skills, and prepare to compete in an exhilarating battle of knowledge. Oceanic Odyssey is the STRIATUM 4.0 Junior Quiz, testing participants in Anatomy and Pharmacology. Teams compete in groups of three, with the top six teams progressing to the grand finale.',
    category: 'quiz',
    specialties: ['Anatomy', 'Pharmacology'],
    format: 'Junior Quiz',
    date: '18 OCT',
    isoDate: '2026-10-18',
    // The brochure publishes a reporting time only. The quiz's own start time,
    // end time and venue are unstated, so no startTime is set — inventing one
    // would put a fabricated slot on the programme grid.
    reportingTime: '8:00 AM',
    participation: 'team',
    teamSize: { min: 3, max: 3 },
    pricing: { entry: 600, spot: 750, unit: 'per_team' },
    // The brochure's general registration rules state the Delegate Fee is not
    // necessary for quizzes.
    delegatePassRequirement: 'not_required',
    eligibility: [
      'Open to first-year, second-year and third-year (2024) medical students.',
      'Only one third-year student from the 2023 batch is allowed per team.',
      'Only two second-year students are allowed per team.',
      'Every team must consist of exactly 3 members.',
      'All three team members must belong to the same college.',
      'There is no restriction on the number of teams from a college.'
    ],
    rules: [
      'Teams must report at 8:00 AM on the day of the event.',
      'Every team member must bring ID proof.',
      'The top 6 teams will be selected for the finals.',
      'The grand finale will be an on-stage event.',
      "In case of any controversy, the Quiz Master's decision is final."
    ],
    prizes: { totalValue: 30000 },
    coordinators: [{ name: 'Velvizhi V.' }, { name: 'Sushama Ghosh I.' }],
    sections: [
      {
        title: 'ELIGIBILITY',
        defaultOpen: true,
        items: [
          'Open to first-year, second-year and third-year (2024) medical students.',
          'Only one third-year student from the 2023 batch is allowed per team.',
          'Only two second-year students are allowed per team.',
          'Every team must consist of exactly 3 members.',
          'All three team members must belong to the same college.',
          'There is no restriction on the number of teams from a college.'
        ]
      },
      {
        title: 'TEAM & EVENT RULES',
        items: [
          'Teams must report at 8:00 AM on the day of the event.',
          'Every team member must bring ID proof.',
          'The top 6 teams will be selected for the finals.',
          'The grand finale will be an on-stage event.',
          "In case of any controversy, the Quiz Master's decision is final."
        ]
      },
      {
        title: 'QUIZ FORMAT',
        body:
          'Teams report at 8:00 AM. The brochure does not publish the start time, end time or venue for this quiz; organisers will confirm them.',
        facts: [
          { label: 'Reporting time', value: '8:00 AM' },
          { label: 'Grand finale', value: 'Top 6 teams · on stage' }
        ]
      },
      {
        title: 'REGISTRATION & PRIZES',
        facts: [
          { label: 'Date', value: '18 October 2026' },
          { label: 'Reporting time', value: '8:00 AM' },
          { label: 'Team size', value: 'Exactly 3 members' },
          { label: 'Entry fee', value: '₹600 per team' },
          { label: 'Spot registration fee', value: '₹750 per team' },
          { label: 'Prize pool', value: '₹30,000' },
          { label: 'Delegate Pass', value: 'Not required for quizzes' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    // Internal only — never rendered. The brochure's eligibility line names the
    // third year as the 2024 batch, while the per-team limit refers to a
    // 2023-batch third year. Both are reproduced above as written rather than
    // silently reconciled.
    needsConfirmation: [
      'Eligibility names "third year (2024)" but the per-team limit refers to a third-year student from the 2023 batch. Organisers to confirm which batch the third-year allowance covers.'
    ],
    keywords: ['anatomy', 'pharmacology', 'quiz', 'junior quiz']
  },

  // ---------------------------------------------------------------------
  // 12. AQUAQUEST
  // ---------------------------------------------------------------------
  {
    id: 's4-12',
    code: 'S4 / 12',
    name: 'AQUAQUEST',
    tagline: 'The stakes are high',
    summary: 'A senior-category Nephrology quiz for teams of three, from second year through CRRI.',
    description:
      'The questions are challenging. The stakes are high. Is your clinical acumen ready? AquaQuest is the STRIATUM 4.0 Senior Quiz, centred on Nephrology. The competition begins with preliminary rounds in the morning, followed by semifinals and finals in the afternoon. The top six teams progress to the on-stage grand finale.',
    category: 'quiz',
    specialties: ['Nephrology'],
    format: 'Senior Quiz',
    date: '18 OCT',
    isoDate: '2026-10-18',
    // Reporting time only; round timings and venue are unpublished.
    reportingTime: '8:00 AM',
    participation: 'team',
    teamSize: { min: 3, max: 3 },
    pricing: { entry: 700, spot: 850, unit: 'per_team' },
    delegatePassRequirement: 'not_required',
    eligibility: [
      'Open to students from second year through CRRI.',
      'Only one CRRI from the 2021 batch is allowed per team.',
      'Only one final-year student from the 2022 batch is allowed per team.',
      'Each team must consist of exactly 3 members.',
      'All team members must belong to the same college.',
      'There is no restriction on the number of teams from a college.'
    ],
    rules: [
      'Teams must report at 8:00 AM on the day of the event.',
      'All team members must bring ID proof.',
      'Preliminary rounds will be conducted in the morning.',
      'Semifinals and finals will follow in the afternoon.',
      'The top 6 teams qualify for the on-stage grand finale.',
      "The Quiz Master's decision is final."
    ],
    prizes: { totalValue: 40000 },
    coordinators: [{ name: 'Valentina J.' }, { name: 'Sakthi S.' }],
    sections: [
      {
        title: 'ELIGIBILITY',
        defaultOpen: true,
        items: [
          'Open to students from second year through CRRI.',
          'Only one CRRI from the 2021 batch is allowed per team.',
          'Only one final-year student from the 2022 batch is allowed per team.',
          'Each team must consist of exactly 3 members.',
          'All team members must belong to the same college.',
          'There is no restriction on the number of teams from a college.'
        ]
      },
      {
        title: 'TEAM & EVENT RULES',
        items: [
          'Teams must report at 8:00 AM on the day of the event.',
          'All team members must bring ID proof.',
          'Preliminary rounds will be conducted in the morning.',
          'Semifinals and finals will follow in the afternoon.',
          'The top 6 teams qualify for the on-stage grand finale.',
          "The Quiz Master's decision is final."
        ]
      },
      {
        title: 'QUIZ FORMAT',
        body:
          'Teams report at 8:00 AM. The brochure gives the order of the rounds but not their exact timings, end time or venue; organisers will confirm them.',
        facts: [
          { label: 'Morning', value: 'Preliminary rounds' },
          { label: 'Afternoon', value: 'Semifinals, then finals' },
          { label: 'Grand finale', value: 'Top 6 teams · on stage' }
        ]
      },
      {
        title: 'REGISTRATION & PRIZES',
        facts: [
          { label: 'Date', value: '18 October 2026' },
          { label: 'Reporting time', value: '8:00 AM' },
          { label: 'Team size', value: 'Exactly 3 members' },
          { label: 'Entry fee', value: '₹700 per team' },
          { label: 'Spot registration fee', value: '₹850 per team' },
          { label: 'Prize pool', value: '₹40,000' },
          { label: 'Delegate Pass', value: 'Not required for quizzes' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['nephrology', 'quiz', 'senior quiz', 'kidney']
  },

  // ---------------------------------------------------------------------
  // 13. GLANDSWARS
  // ---------------------------------------------------------------------
  {
    id: 's4-13',
    code: 'S4 / 13',
    name: 'GLANDSWARS',
    tagline: 'Three rounds, online to on-site',
    summary: 'An Endocrinology quiz for two-member teams: online prelims, then offline semifinals and finals.',
    description:
      'GlandsWars is a three-round Endocrinology competition, beginning with online preliminaries before progressing to offline semifinals and finals. Cross-college teams are allowed.',
    category: 'quiz',
    specialties: ['Endocrinology'],
    format: 'Quiz',
    // The online prelim on 3 October is the one round with a confirmed exact
    // time. The semifinals and finals are on 14 October with timings unstated.
    date: '3 OCT',
    isoDate: '2026-10-03',
    isoEndDate: '2026-10-14',
    startTime: '6:00 PM',
    endTime: '6:45 PM',
    mode: 'hybrid',
    participation: 'team',
    teamSize: { min: 2, max: 2 },
    pricing: { entry: 300, unit: 'per_team' },
    delegatePassRequirement: 'not_required',
    eligibility: [
      'MBBS students from 1st year to CRRI are eligible.',
      'Maximum 2 members per team.',
      'Only one CRRI from the 2021 batch is permitted per team.',
      'Cross-college teams are allowed.'
    ],
    rules: [
      'Both team members must register with their correct name, year of study, college and contact details.',
      'Once registered, team members cannot be changed without prior permission from the organising committee.',
      'During the online preliminaries, the camera must always remain ON.',
      'Any identified malpractice will result in disqualification.'
    ],
    prizes: { totalValue: 15000 },
    coordinators: [{ name: 'Dikshaya S.' }, { name: 'Dharani M.' }],
    sections: [
      {
        title: 'ELIGIBILITY',
        defaultOpen: true,
        items: [
          'MBBS students from 1st year to CRRI are eligible.',
          'Maximum 2 members per team.',
          'Only one CRRI from the 2021 batch is permitted per team.',
          'Cross-college teams are allowed.'
        ]
      },
      {
        title: 'REGISTRATION & TEAM RULES',
        items: [
          'Both team members must register with their correct name, year of study, college and contact details.',
          'Once registered, team members cannot be changed without prior permission from the organising committee.',
          'During the online preliminaries, the camera must always remain ON.',
          'Any identified malpractice will result in disqualification.'
        ]
      },
      {
        title: 'COMPETITION FORMAT',
        body:
          'The brochure publishes an exact time for the online preliminaries only. Semifinal and final timings and the venue are not stated.',
        facts: [
          {
            label: 'Round 01 · Prelims',
            value: 'Online · 3 October 2026 · 6:00 PM – 6:45 PM · 45 questions in 45 minutes'
          },
          { label: 'Round 02 · Semifinals', value: 'Offline · 14 October 2026 · top 10 teams qualify' },
          { label: 'Round 03 · Finals', value: 'Offline · 14 October 2026 · top 6 teams qualify' }
        ]
      },
      {
        title: 'REGISTRATION & PRIZES',
        facts: [
          { label: 'Team size', value: 'Maximum 2 members' },
          { label: 'Entry fee', value: '₹300 per team' },
          { label: 'Prize pool', value: '₹15,000' },
          { label: 'Delegate Pass', value: 'Not required for quizzes' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['endocrinology', 'quiz', 'hormones', 'thyroid', 'glands']
  }
];
