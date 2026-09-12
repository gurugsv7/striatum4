/**
 * STRIATUM 4.0 — Events 1–13 (Workshops 1–10, Quizzes 11–13).
 *
 * Sourced exclusively from STRIATUM_4.0_Website_Event_Master_Data.md.
 * Never invent a fact: a field the brochure does not state is simply omitted.
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
      'Gowning',
      'Gloving techniques'
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
          'Gowning',
          'Gloving techniques'
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
    summary: 'A junior-category quiz testing Anatomy and Pharmacology knowledge for first- to third-year students.',
    description:
      'A team quiz on Anatomy and Pharmacology open to first-year, second-year and eligible third-year medical students, with the top 6 teams advancing to an on-stage grand finale.',
    category: 'quiz',
    specialties: ['Anatomy', 'Pharmacology'],
    format: 'Junior Quiz',
    reportingTime: '8:00 AM',
    participation: 'team',
    teamSize: { min: 3, max: 3 },
    pricing: { entry: 600, spot: 750, unit: 'per_team' },
    delegatePassRequirement: 'unspecified',
    eligibility: [
      'Open to first-year, second-year and eligible third-year medical students.',
      'Only one 2023-batch third-year student per team is allowed.',
      'Maximum two second-year students per team.',
      'All team members must belong to the same college.',
      'No restriction on number of teams per college.'
    ],
    rules: [
      'All team members must bring ID proof.',
      'Top 6 teams qualify for finals.',
      "Quiz master's decision is final."
    ],
    prizes: { totalValue: 30000 },
    coordinators: [{ name: 'Velvizhi V.' }, { name: 'Sushama Ghosh I.' }],
    sections: [
      {
        title: 'ELIGIBILITY',
        defaultOpen: true,
        items: [
          'Open to first-year, second-year and eligible third-year medical students.',
          'Only one 2023-batch third-year student per team is allowed.',
          'Maximum two second-year students per team.',
          'All team members must belong to the same college.',
          'No restriction on number of teams per college.'
        ]
      },
      {
        title: 'TEAM RULES',
        items: [
          'All team members must bring ID proof.',
          'Top 6 teams qualify for finals.',
          "Quiz master's decision is final."
        ]
      },
      {
        title: 'QUIZ FORMAT',
        items: ['Grand finale is an on-stage event.']
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Reporting Time', value: '8:00 AM' },
          { label: 'Team Size', value: '3' },
          { label: 'Entry Fee', value: '₹600 per team' },
          { label: 'Spot Fee', value: '₹750 per team' },
          { label: 'Prize Pool', value: '₹40,000' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['anatomy', 'pharmacology', 'quiz', 'junior quiz']
  },

  // ---------------------------------------------------------------------
  // 12. AQUAQUEST
  // ---------------------------------------------------------------------
  {
    id: 's4-12',
    code: 'S4 / 12',
    name: 'AQUAQUEST',
    summary: 'A senior-category Nephrology quiz for second-year students through CRRI.',
    description:
      'A team quiz on Nephrology open to students from second year through CRRI, run in preliminary, semifinal and final rounds, with the top 6 teams advancing to an on-stage grand finale.',
    category: 'quiz',
    specialties: ['Nephrology'],
    format: 'Senior Quiz',
    reportingTime: '8:00 AM',
    participation: 'team',
    teamSize: { min: 3, max: 3 },
    pricing: { entry: 700, spot: 850, unit: 'per_team' },
    delegatePassRequirement: 'unspecified',
    eligibility: [
      'Open to second-year students through CRRI.',
      'Only one CRRI from the 2021 batch per team.',
      'Only one final-year student from the 2022 batch per team.',
      'All members must belong to the same college.',
      'No restriction on teams per college.'
    ],
    rules: [
      'ID proof required.',
      'Top 6 teams qualify for the on-stage grand finale.',
      "Quiz master's decision is final."
    ],
    prizes: { totalValue: 40000 },
    coordinators: [{ name: 'Valentina Sakthi' }],
    sections: [
      {
        title: 'ELIGIBILITY',
        defaultOpen: true,
        items: [
          'Open to second-year students through CRRI.',
          'Only one CRRI from the 2021 batch per team.',
          'Only one final-year student from the 2022 batch per team.',
          'All members must belong to the same college.',
          'No restriction on teams per college.'
        ]
      },
      {
        title: 'TEAM RULES',
        items: [
          'ID proof required.',
          'Top 6 teams qualify for the on-stage grand finale.',
          "Quiz master's decision is final."
        ]
      },
      {
        title: 'QUIZ FORMAT',
        items: [
          'Preliminary rounds are conducted in the morning.',
          'Semifinals and finals follow in the afternoon.'
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Reporting Time', value: '8:00 AM' },
          { label: 'Team Size', value: '3' },
          { label: 'Entry Fee', value: '₹700 per team' },
          { label: 'Spot Fee', value: '₹850 per team' },
          { label: 'Prize Pool', value: '₹30,000' }
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
    summary: 'An Endocrinology quiz for two-member teams, run online in prelims and offline for semifinals and finals.',
    description:
      'A team quiz on Endocrinology open to MBBS students from first year through CRRI, with cross-college teams allowed. Online prelims are followed by offline semifinals and finals for the top qualifying teams.',
    category: 'quiz',
    specialties: ['Endocrinology'],
    format: 'Quiz',
    // Prelims open the quiz on 3 October; semifinals and finals are on the
    // 13th. Both dates are stated in the brochure.
    date: '3 OCT',
    isoDate: '2026-10-03',
    isoEndDate: '2026-10-13',
    startTime: '6:00 PM',
    endTime: '6:45 PM',
    mode: 'hybrid',
    participation: 'team',
    teamSize: { min: 2, max: 2 },
    pricing: { entry: 15000, unit: 'per_team' },
    delegatePassRequirement: 'unspecified',
    eligibility: [
      'MBBS students from 1st year through CRRI are eligible.',
      'Cross-college teams are allowed.'
    ],
    rules: [
      'Maximum one CRRI from the 2021 batch per team.',
      'Both members must register using correct name, year, college and contact details.',
      'Team members cannot be changed without prior permission.',
      'Camera must remain ON during online prelims.',
      'Identified malpractice leads to disqualification.'
    ],
    coordinators: [{ name: 'Dikshaya S.' }, { name: 'Dharani M.' }],
    sections: [
      {
        title: 'ELIGIBILITY',
        defaultOpen: true,
        items: [
          'MBBS students from 1st year through CRRI are eligible.',
          'Cross-college teams are allowed.'
        ]
      },
      {
        title: 'TEAM RULES',
        items: [
          'Maximum one CRRI from the 2021 batch per team.',
          'Both members must register using correct name, year, college and contact details.',
          'Team members cannot be changed without prior permission.',
          'Camera must remain ON during online prelims.',
          'Identified malpractice leads to disqualification.'
        ]
      },
      {
        title: 'QUIZ FORMAT',
        facts: [
          { label: 'Prelims', value: 'Online · 3 October 2026 · 6:00 PM – 6:45 PM · 45 questions (45 minutes)' },
          { label: 'Semifinals', value: 'Offline · 13 October 2026 · Top 12 teams qualify' },
          { label: 'Finals', value: 'Offline · 13 October 2026 · Top 6 teams qualify' }
        ]
      },
      {
        title: 'IMPORTANT INFORMATION',
        facts: [
          { label: 'Team Size', value: 'Maximum 2' },
          { label: 'Entry Fee', value: '₹15,000 per team' }
        ]
      }
    ],
    status: 'open',
    registerable: true,
    keywords: ['endocrinology', 'quiz', 'hormones', 'thyroid']
  }
];
