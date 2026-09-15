/**
 * SIGMA'26 — the students' council, exactly as the council document lists it.
 *
 * Roles and names only. The document also carries a personal mobile number for
 * every member; those are deliberately not here. An event in-charge publishes a
 * number because delegates need to reach them about that event, which is not
 * the same as putting eighteen students' phones on a public page.
 *
 * "Accommodation" is spelled correctly here; the source document has it with
 * one M.
 */

export interface CouncilMember {
  role: string;
  name: string;
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
    members: [{ role: 'President', name: 'Rajakumar J' }]
  },
  {
    index: '02',
    title: 'ADVISORY BOARD',
    blurb: 'Oversees the association alongside the president.',
    members: [
      { role: 'Vice President', name: 'Mohammed Faham V.T' },
      { role: 'Joint Secretary', name: 'Sudarshan JV' },
      { role: 'Treasurer', name: 'Aswin E' },
      { role: 'Public Relations', name: 'Potrivelan P' }
    ]
  },
  {
    index: '03',
    title: 'EXECUTIVE BOARD',
    blurb: 'Runs the portfolios the conclave is built from.',
    members: [
      { role: 'General Secretary', name: 'Mugeshraj R' },
      { role: 'Cultural Secretary', name: 'Themozhi Yazhini A' },
      { role: 'Academic Secretary', name: 'Kaviya Dharshini K' },
      { role: 'Sports Secretary', name: 'Thirumurugan S' },
      { role: 'Fine Arts Secretary', name: 'Jenna Mariam Joji' },
      { role: 'Literature and Debate Secretary', name: 'Dhroov Chikara' },
      { role: 'Social Service Secretary', name: 'Donisha M' },
      { role: 'Photography Secretary', name: 'Hari Pranav MN' },
      { role: 'Chief Designer', name: 'Krishna Kumar R' },
      { role: 'Technical Secretary', name: 'Vignesh D' },
      { role: 'Awards and Accommodation Secretary', name: 'Sudikksha Rhashmi S' },
      { role: 'Food and Transport Secretary', name: 'Devraj Kumar' },
      { role: 'Anti-Ragging and Students Wellness Secretary', name: 'Srivarsan J' }
    ]
  }
];

/** Everyone on the council, for counts and for the page's own summary line. */
export const COUNCIL_COUNT = COUNCIL_TIERS.reduce((sum, tier) => sum + tier.members.length, 0);
