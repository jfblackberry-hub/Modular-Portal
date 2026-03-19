export type PatientStatus = 'Active' | 'Inactive';
export type PatientRiskLevel = 'Low' | 'Moderate' | 'High' | 'Rising';
export type PgxStatus = 'Available' | 'Pending' | 'Not Ordered';
export type AlertFlag = 'ED visit' | 'Inpatient discharge' | 'Adherence risk' | 'Transportation barrier';

export interface PatientProgramEnrollment {
  id: string;
  programName:
    | 'Pre-Diabetes Prevention'
    | 'Smoking Cessation'
    | 'Weight Management'
    | 'Maternity Support'
    | 'Behavioral Health Support'
    | 'Complex Case Management'
    | 'Medication Therapy Management'
    | 'Remote Monitoring'
    | 'Social Support / Community Assistance';
  status: 'Enrolled' | 'Referred' | 'Outreach in progress' | 'Completed' | 'Declined';
  effectiveDate: string;
  referringEntity: string;
  lastOutreach: string;
  nextActionDue: string;
  notesPreview: string;
}

export interface PatientPgxSummary {
  status: PgxStatus;
  dateOrdered?: string;
  dateResulted?: string;
  medications: string[];
  considerationSummary: string;
  alertLevel: 'Routine' | 'Monitor' | 'Action recommended';
  source: string;
  disclaimer: string;
}

export interface PatientSupplementalData {
  careManagementSummary: string;
  sdhIndicators: string[];
  adherenceFlags: string[];
  utilizationSummary: string;
  assessmentHighlights: string[];
  clinicalInsights: string[];
  screeningStatus: string;
  pgx: PatientPgxSummary;
}

export interface ProviderPatientRecord {
  id: string;
  patientName: string;
  memberId: string;
  dob: string;
  phone: string;
  claimNumber?: string;
  authorizationNumber?: string;
  assignedProvider: string;
  pcp: string;
  status: PatientStatus;
  riskLevel: PatientRiskLevel;
  payer: string;
  productLine: string;
  planId: string;
  alternateId: string;
  lastVisitDate: string;
  lastActivityDate: string;
  openCareGaps: number;
  recentFlags: AlertFlag[];
  specialPrograms: PatientProgramEnrollment[];
  supplementalData: PatientSupplementalData;
  medicationsSummary: string[];
  activeConditions: string[];
  coverageSnapshot: string;
  careTeam: string[];
  notesTimeline: Array<{ id: string; date: string; note: string }>;
}

export const providerPatients: ProviderPatientRecord[] = [
  {
    id: 'pt-1001',
    patientName: 'Taylor Morgan',
    memberId: 'M-48291',
    dob: '1983-04-17',
    phone: '(313) 555-0142',
    claimNumber: 'CLM-100245',
    authorizationNumber: 'PA-100245',
    assignedProvider: 'Jordan Lee, MD',
    pcp: 'Jordan Lee, MD',
    status: 'Active',
    riskLevel: 'High',
    payer: 'Blue Horizon Health',
    productLine: 'Commercial PPO',
    planId: 'BHH-MI-4420',
    alternateId: 'ALT-88412',
    lastVisitDate: '2026-03-11',
    lastActivityDate: '2026-03-18',
    openCareGaps: 3,
    recentFlags: ['ED visit', 'Adherence risk'],
    specialPrograms: [
      {
        id: 'pgm-1001-a',
        programName: 'Complex Case Management',
        status: 'Enrolled',
        effectiveDate: '2026-01-08',
        referringEntity: 'Health plan care management',
        lastOutreach: '2026-03-17',
        nextActionDue: '2026-03-22',
        notesPreview: 'Post-ED follow-up and medication reconciliation pending.'
      },
      {
        id: 'pgm-1001-b',
        programName: 'Medication Therapy Management',
        status: 'Outreach in progress',
        effectiveDate: '2026-02-19',
        referringEntity: 'Pharmacy quality team',
        lastOutreach: '2026-03-14',
        nextActionDue: '2026-03-21',
        notesPreview: 'Needs refill adherence review for statin therapy.'
      }
    ],
    supplementalData: {
      careManagementSummary: 'High-touch case management due to repeat ED use and uncontrolled diabetes.',
      sdhIndicators: ['Food insecurity screening positive', 'Transportation support requested'],
      adherenceFlags: ['Delayed fill: rosuvastatin', 'Missed CGM supply reorder'],
      utilizationSummary: '1 ED visit in last 30 days, no inpatient stays, 2 specialist visits in last 90 days.',
      assessmentHighlights: ['A1c 9.1%', 'BMI 34', 'Needs annual retinal exam'],
      clinicalInsights: ['Diabetes bundle incomplete', 'Behavioral health screening overdue'],
      screeningStatus: 'Breast cancer screening outreach completed; colorectal screening pending.',
      pgx: {
        status: 'Available',
        dateOrdered: '2026-01-15',
        dateResulted: '2026-01-29',
        medications: ['Clopidogrel', 'Sertraline'],
        considerationSummary: 'Gene-drug interactions noted for antiplatelet therapy response and SSRI metabolism.',
        alertLevel: 'Action recommended',
        source: 'Blue Horizon PGx partner lab',
        disclaimer: 'Interpretation should follow treating clinician judgment and plan guidance.'
      }
    },
    medicationsSummary: ['Metformin ER', 'Semaglutide', 'Rosuvastatin', 'Sertraline'],
    activeConditions: ['Type 2 diabetes', 'Hypertension', 'Depression'],
    coverageSnapshot: 'Active through 2026-12-31, PCP assigned, care management eligible.',
    careTeam: ['Jordan Lee, MD', 'Ana Foster, RN Care Manager', 'Blue Horizon Pharmacy Team'],
    notesTimeline: [
      { id: 'note-1001-a', date: '2026-03-18', note: 'Claims note: ED claim processed and flagged for follow-up.' },
      { id: 'note-1001-b', date: '2026-03-17', note: 'Care manager left voicemail for post-discharge medication review.' },
      { id: 'note-1001-c', date: '2026-03-11', note: 'PCP follow-up completed with updated glucose management plan.' }
    ]
  },
  {
    id: 'pt-1002',
    patientName: 'Jordan Patel',
    memberId: 'M-77420',
    dob: '1977-09-08',
    phone: '(248) 555-0188',
    claimNumber: 'CLM-100233',
    authorizationNumber: 'PA-100233',
    assignedProvider: 'Jordan Lee, MD',
    pcp: 'Jordan Lee, MD',
    status: 'Active',
    riskLevel: 'Moderate',
    payer: 'Blue Horizon Health',
    productLine: 'Commercial HMO',
    planId: 'BHH-MI-2194',
    alternateId: 'ALT-22914',
    lastVisitDate: '2026-03-04',
    lastActivityDate: '2026-03-16',
    openCareGaps: 2,
    recentFlags: ['Inpatient discharge'],
    specialPrograms: [
      {
        id: 'pgm-1002-a',
        programName: 'Smoking Cessation',
        status: 'Enrolled',
        effectiveDate: '2026-02-02',
        referringEntity: 'PCP office',
        lastOutreach: '2026-03-10',
        nextActionDue: '2026-03-24',
        notesPreview: 'Nicotine replacement plan discussed; coach follow-up due.'
      }
    ],
    supplementalData: {
      careManagementSummary: 'Recent orthopedic inpatient discharge with transition-of-care outreach completed.',
      sdhIndicators: ['Lives alone'],
      adherenceFlags: ['PT visits not yet scheduled'],
      utilizationSummary: '1 inpatient admission in last 60 days; no ED revisit.',
      assessmentHighlights: ['Fall risk moderate', 'Tobacco use active'],
      clinicalInsights: ['Transition of care visit recommended within 14 days'],
      screeningStatus: 'Depression screening completed; tobacco counseling in progress.',
      pgx: {
        status: 'Pending',
        dateOrdered: '2026-03-12',
        medications: ['Hydrocodone-acetaminophen'],
        considerationSummary: 'Result pending for medication response review after discharge.',
        alertLevel: 'Monitor',
        source: 'Blue Horizon utilization management',
        disclaimer: 'Interpretation should follow treating clinician judgment and plan guidance.'
      }
    },
    medicationsSummary: ['Lisinopril', 'Hydrocodone-acetaminophen', 'Nicotine patch'],
    activeConditions: ['Lumbar radiculopathy', 'Hypertension', 'Tobacco use disorder'],
    coverageSnapshot: 'Active through 2026-12-31, post-acute case review open.',
    careTeam: ['Jordan Lee, MD', 'Maya Collins, RN', 'Smoking cessation coach'],
    notesTimeline: [
      { id: 'note-1002-a', date: '2026-03-16', note: 'Discharge summary reviewed; TOC visit still needs scheduling.' },
      { id: 'note-1002-b', date: '2026-03-13', note: 'Auth request updated with additional PT documentation.' }
    ]
  },
  {
    id: 'pt-1003',
    patientName: 'Avery Brooks',
    memberId: 'M-55832',
    dob: '1991-12-29',
    phone: '(734) 555-0121',
    claimNumber: 'CLM-100217',
    authorizationNumber: 'PA-100217',
    assignedProvider: 'Jordan Lee, MD',
    pcp: 'Jordan Lee, MD',
    status: 'Active',
    riskLevel: 'Rising',
    payer: 'Blue Horizon Health',
    productLine: 'Marketplace Silver',
    planId: 'BHH-MI-5538',
    alternateId: 'ALT-55103',
    lastVisitDate: '2026-02-28',
    lastActivityDate: '2026-03-13',
    openCareGaps: 1,
    recentFlags: [],
    specialPrograms: [
      {
        id: 'pgm-1003-a',
        programName: 'Behavioral Health Support',
        status: 'Referred',
        effectiveDate: '2026-03-01',
        referringEntity: 'PCP depression screening',
        lastOutreach: '2026-03-05',
        nextActionDue: '2026-03-20',
        notesPreview: 'Awaiting first counseling intake appointment.'
      },
      {
        id: 'pgm-1003-b',
        programName: 'Weight Management',
        status: 'Outreach in progress',
        effectiveDate: '2026-02-18',
        referringEntity: 'Health plan wellness program',
        lastOutreach: '2026-03-09',
        nextActionDue: '2026-03-23',
        notesPreview: 'Patient engaged through app but has not booked nutrition visit.'
      }
    ],
    supplementalData: {
      careManagementSummary: 'Behavioral health coordination and preventive support outreach active.',
      sdhIndicators: ['Housing stable', 'Financial stress reported'],
      adherenceFlags: ['Missed annual wellness visit reminder'],
      utilizationSummary: 'No acute utilization in past 6 months.',
      assessmentHighlights: ['PHQ-9 elevated', 'Weight trend increasing'],
      clinicalInsights: ['Sleep study authorization approved, scheduling pending'],
      screeningStatus: 'Behavioral health outreach accepted; nutrition screening not completed.',
      pgx: {
        status: 'Not Ordered',
        medications: [],
        considerationSummary: 'No current health plan-sponsored PGx order on file.',
        alertLevel: 'Routine',
        source: 'Not available',
        disclaimer: 'Interpretation should follow treating clinician judgment and plan guidance.'
      }
    },
    medicationsSummary: ['Bupropion XL', 'Vitamin D'],
    activeConditions: ['Depression', 'Obesity'],
    coverageSnapshot: 'Active marketplace coverage with wellness coaching benefit.',
    careTeam: ['Jordan Lee, MD', 'Alex Kim, LCSW'],
    notesTimeline: [
      { id: 'note-1003-a', date: '2026-03-13', note: 'Patient portal message sent for counseling intake follow-up.' },
      { id: 'note-1003-b', date: '2026-03-09', note: 'Weight management outreach attempt completed.' }
    ]
  },
  {
    id: 'pt-1004',
    patientName: 'Carmen Alvarez',
    memberId: 'M-66104',
    dob: '1989-07-21',
    phone: '(586) 555-0199',
    assignedProvider: 'Jordan Lee, MD',
    pcp: 'Jordan Lee, MD',
    status: 'Active',
    riskLevel: 'Moderate',
    payer: 'Blue Horizon Health',
    productLine: 'Commercial PPO',
    planId: 'BHH-MI-8810',
    alternateId: 'ALT-67155',
    lastVisitDate: '2026-03-15',
    lastActivityDate: '2026-03-18',
    openCareGaps: 2,
    recentFlags: [],
    specialPrograms: [
      {
        id: 'pgm-1004-a',
        programName: 'Maternity Support',
        status: 'Enrolled',
        effectiveDate: '2025-12-12',
        referringEntity: 'OB referral',
        lastOutreach: '2026-03-12',
        nextActionDue: '2026-03-26',
        notesPreview: 'Third trimester support call completed; postpartum planning underway.'
      },
      {
        id: 'pgm-1004-b',
        programName: 'Remote Monitoring',
        status: 'Enrolled',
        effectiveDate: '2026-01-05',
        referringEntity: 'Maternal health team',
        lastOutreach: '2026-03-18',
        nextActionDue: '2026-03-20',
        notesPreview: 'Blood pressure data received; one elevated reading reviewed by nurse.'
      }
    ],
    supplementalData: {
      careManagementSummary: 'Maternal health monitoring active with weekly BP check-ins.',
      sdhIndicators: ['Childcare support requested'],
      adherenceFlags: [],
      utilizationSummary: 'No ED visits; prenatal care on track.',
      assessmentHighlights: ['EDD 2026-05-04', 'BP trend mostly controlled'],
      clinicalInsights: ['Postpartum depression screening prep added'],
      screeningStatus: 'Prenatal depression screening complete; doula referral accepted.',
      pgx: {
        status: 'Not Ordered',
        medications: [],
        considerationSummary: 'No PGx order at this time.',
        alertLevel: 'Routine',
        source: 'Not available',
        disclaimer: 'Interpretation should follow treating clinician judgment and plan guidance.'
      }
    },
    medicationsSummary: ['Prenatal vitamin', 'Labetalol'],
    activeConditions: ['Pregnancy', 'Chronic hypertension'],
    coverageSnapshot: 'Active maternity program enrollment with remote monitoring benefit.',
    careTeam: ['Jordan Lee, MD', 'Elena Morris, RN', 'Blue Horizon Maternal Health'],
    notesTimeline: [
      { id: 'note-1004-a', date: '2026-03-18', note: 'Remote BP reading escalated and reviewed; no urgent symptoms.' }
    ]
  },
  {
    id: 'pt-1005',
    patientName: 'Noah Simmons',
    memberId: 'M-33981',
    dob: '1958-01-13',
    phone: '(248) 555-0176',
    claimNumber: 'CLM-100266',
    assignedProvider: 'Jordan Lee, MD',
    pcp: 'Jordan Lee, MD',
    status: 'Inactive',
    riskLevel: 'High',
    payer: 'Blue Horizon Medicare Advantage',
    productLine: 'Medicare Advantage',
    planId: 'BHH-MA-7732',
    alternateId: 'ALT-77210',
    lastVisitDate: '2025-12-09',
    lastActivityDate: '2026-02-26',
    openCareGaps: 4,
    recentFlags: ['ED visit', 'Transportation barrier'],
    specialPrograms: [
      {
        id: 'pgm-1005-a',
        programName: 'Social Support / Community Assistance',
        status: 'Outreach in progress',
        effectiveDate: '2026-02-20',
        referringEntity: 'Plan concierge team',
        lastOutreach: '2026-03-01',
        nextActionDue: '2026-03-20',
        notesPreview: 'Transportation vendor options shared; needs renewed PCP appointment.'
      }
    ],
    supplementalData: {
      careManagementSummary: 'Coverage termed at prior group level; case remains visible for transition support.',
      sdhIndicators: ['Transportation instability', 'Lives alone'],
      adherenceFlags: ['No refill in 45 days: inhaler'],
      utilizationSummary: '1 ED visit in last 45 days before inactive status.',
      assessmentHighlights: ['COPD action plan overdue', 'Annual wellness visit missed'],
      clinicalInsights: ['Re-engagement opportunity if coverage reinstated'],
      screeningStatus: 'Outreach incomplete due to unreachable phone number.',
      pgx: {
        status: 'Available',
        dateOrdered: '2025-10-20',
        dateResulted: '2025-11-02',
        medications: ['Codeine'],
        considerationSummary: 'Metabolism result may affect opioid response and adverse-event risk.',
        alertLevel: 'Monitor',
        source: 'Medicare pharmacy program',
        disclaimer: 'Interpretation should follow treating clinician judgment and plan guidance.'
      }
    },
    medicationsSummary: ['Trelegy Ellipta', 'Albuterol', 'Atorvastatin'],
    activeConditions: ['COPD', 'Hyperlipidemia'],
    coverageSnapshot: 'Inactive as of 2026-02-28; outreach retained for transition support.',
    careTeam: ['Jordan Lee, MD', 'Community assistance liaison'],
    notesTimeline: [
      { id: 'note-1005-a', date: '2026-02-26', note: 'Claim denied after coverage termination; office follow-up recommended.' }
    ]
  },
  {
    id: 'pt-1006',
    patientName: 'Leah Washington',
    memberId: 'M-91422',
    dob: '1966-06-05',
    phone: '(517) 555-0110',
    authorizationNumber: 'PA-100291',
    assignedProvider: 'Jordan Lee, MD',
    pcp: 'Jordan Lee, MD',
    status: 'Active',
    riskLevel: 'High',
    payer: 'Blue Horizon Health',
    productLine: 'Commercial PPO',
    planId: 'BHH-MI-6624',
    alternateId: 'ALT-60217',
    lastVisitDate: '2026-03-08',
    lastActivityDate: '2026-03-19',
    openCareGaps: 1,
    recentFlags: ['Inpatient discharge'],
    specialPrograms: [
      {
        id: 'pgm-1006-a',
        programName: 'Pre-Diabetes Prevention',
        status: 'Completed',
        effectiveDate: '2025-04-01',
        referringEntity: 'Population health team',
        lastOutreach: '2026-02-27',
        nextActionDue: '2026-06-01',
        notesPreview: 'Graduated from prevention cohort; maintenance outreach quarterly.'
      },
      {
        id: 'pgm-1006-b',
        programName: 'Medication Therapy Management',
        status: 'Enrolled',
        effectiveDate: '2026-03-06',
        referringEntity: 'Discharge pharmacist',
        lastOutreach: '2026-03-18',
        nextActionDue: '2026-03-25',
        notesPreview: 'ACE inhibitor restart counseling completed; monitor potassium.'
      }
    ],
    supplementalData: {
      careManagementSummary: 'Post-discharge medication review active after heart failure observation stay.',
      sdhIndicators: ['Utilities affordability concern'],
      adherenceFlags: ['Recent diuretic gap resolved'],
      utilizationSummary: '1 inpatient observation stay in last 30 days.',
      assessmentHighlights: ['BP controlled', 'Needs repeat BMP in 7 days'],
      clinicalInsights: ['Discharge med list reconciled; heart failure follow-up within 7 days met'],
      screeningStatus: 'Annual wellness screening complete.',
      pgx: {
        status: 'Available',
        dateOrdered: '2026-02-28',
        dateResulted: '2026-03-07',
        medications: ['Metoprolol', 'Nortriptyline'],
        considerationSummary: 'Metabolism profile suggests closer monitoring for selected cardio and psychotropic therapies.',
        alertLevel: 'Monitor',
        source: 'Blue Horizon medication optimization program',
        disclaimer: 'Interpretation should follow treating clinician judgment and plan guidance.'
      }
    },
    medicationsSummary: ['Furosemide', 'Lisinopril', 'Metoprolol succinate'],
    activeConditions: ['Heart failure', 'Hypertension', 'Prediabetes'],
    coverageSnapshot: 'Active through employer plan year with care management benefits.',
    careTeam: ['Jordan Lee, MD', 'Denise Hall, PharmD', 'Heart failure case manager'],
    notesTimeline: [
      { id: 'note-1006-a', date: '2026-03-19', note: 'Patient called with medication question; pharmacist follow-up arranged.' },
      { id: 'note-1006-b', date: '2026-03-08', note: 'Post-discharge office visit completed.' }
    ]
  }
];

export const patientRecentSearches = ['Taylor Morgan', 'PA-100233', 'Smoking cessation', 'BHH-MI-5538'];

export const patientSavedFilters = [
  { id: 'high-risk', label: 'High Risk Panel' },
  { id: 'programs', label: 'Program Enrolled' },
  { id: 'pgx', label: 'PGx Available' },
  { id: 'care-gaps', label: 'Open Care Gaps' }
];
