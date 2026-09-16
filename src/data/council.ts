/**
 * SIGMA'26 — the students' council, exactly as the council document lists it.
 *
 * Roles, names and the contact number printed beside each name in the council
 * document. The numbers were held back when this page was first built; the
 * organisers have since asked for them to be published, which is their call to
 * make about their own council.
 *
 * "Accommodation" is spelled correctly here; the source document has it with
 * one M.
 */

export interface CouncilMember {
  role: string;
  name: string;
  /** As printed in the council document, digits only. */
  phone?: string;
}

export interface CouncilTier {
  /** Rail number, matching how every other screen numbers its sections. */
  index: string;
  title: string;
  /** One line saying what this tier is, so the page is not a bare list. */
  blurb: string;
  members: CouncilMember[];
}

export const COUNCIL_BODY = 'Students of Indira Gandhi Medical College Association';

export const COUNCIL_TIERS: CouncilTier[] = [
  {
    index: '01',
    title: 'PRESIDENT',
    blurb: 'Heads the association and the conclave.',
    members: [{ role: 'President', name: 'Rajakumar J', phone: '8925200429' }]
  },
  {
    index: '02',
    title: 'ADVISORY BOARD',
    blurb: 'Oversees the association alongside the president.',
    members: [
      { role: 'Vice President', name: 'Mohammed Faham V.T', phone: '8714733484' },
      { role: 'Joint Secretary', name: 'Sudarshan JV', phone: '9487834797' },
      { role: 'Treasurer', name: 'Aswin E', phone: '7806825939' },
      { role: 'Public Relations', name: 'Potrivelan P', phone: '9080616925' }
    ]
  },
  {
    index: '03',
    title: 'EXECUTIVE BOARD',
    blurb: 'Runs the portfolios the conclave is built from.',
    members: [
      { role: 'General Secretary', name: 'Mugeshraj R', phone: '6381280244' },
      { role: 'Cultural Secretary', name: 'Themozhi Yazhini A', phone: '9843125704' },
      { role: 'Academic Secretary', name: 'Kaviya Dharshini K', phone: '6380592296' },
      { role: 'Sports Secretary', name: 'Thirumurugan S', phone: '9952764586' },
      { role: 'Fine Arts Secretary', name: 'Jenna Mariam Joji', phone: '7558022834' },
      { role: 'Literature and Debate Secretary', name: 'Dhroov Chikara', phone: '8279471806' },
      { role: 'Social Service Secretary', name: 'Donisha M', phone: '7845280168' },
      { role: 'Photography Secretary', name: 'Hari Pranav MN', phone: '9366622308' },
      { role: 'Chief Designer', name: 'Krishna Kumar R', phone: '9790019936' },
      { role: 'Technical Secretary', name: 'Vignesh D', phone: '9042059951' },
      { role: 'Awards and Accommodation Secretary', name: 'Sudikksha Rhashmi S', phone: '9042705767' },
      { role: 'Food and Transport Secretary', name: 'Devraj Kumar', phone: '7631387585' },
      { role: 'Anti-Ragging and Students Wellness Secretary', name: 'Srivarsan J', phone: '8903494521' }
    ]
  }
];

/** Everyone on the council, for counts and for the page's own summary line. */
export const COUNCIL_COUNT = COUNCIL_TIERS.reduce((sum, tier) => sum + tier.members.length, 0);
