export type BrokerGroupStatus =
  | 'Active'
  | 'Renewal in progress'
  | 'Quote in progress'
  | 'Enrollment in progress'
  | 'Implementation active'
  | 'At risk';

export type BrokerGroup = {
  id: string;
  groupName: string;
  segment: 'Small group' | 'Mid-market' | 'Large group' | 'National account';
  effectiveDate: string;
  renewalDate: string;
  enrolledLives: number;
  currentProducts: string[];
  status: BrokerGroupStatus;
  region: 'Midwest' | 'Northeast' | 'Southeast' | 'Southwest' | 'West';
  assignedRep: string;
  accountManager: string;
  lineOfBusiness: 'Medical' | 'Medical + Dental' | 'Medical + Ancillary' | 'Full suite';
  alerts: string[];
  carrierAlerts: string[];
  mtdCommission: number;
  commissionStatus: 'Posted' | 'Pending adjustment' | 'Under review';
  renewalSummary: {
    stage: string;
    decisionDeadline: string;
    rateReleaseDate: string;
    blockers: string[];
    lastTouchpoint: string;
  };
  enrollmentSummary: {
    status: string;
    completionRate: number;
    pendingItems: string[];
    lastFileDate: string;
    effectiveDate: string;
  };
  documentsSummary: {
    missingItems: string[];
    recentDocuments: string[];
  };
  plansSummary: Array<{
    carrier: string;
    planName: string;
    fundingType: string;
    enrolledEmployees: number;
    effectiveDate: string;
  }>;
  quoteOpportunity?: {
    requestedDate: string;
    carriers: string[];
    stage: string;
    missingItems: string[];
  };
  activities: Array<{
    date: string;
    actor: string;
    type: string;
    description: string;
  }>;
  notes: string[];
};

export type BrokerTask = {
  id: string;
  groupId: string;
  title: string;
  detail: string;
  status: string;
  dueDate: string;
  href: string;
  category: 'renewal' | 'quote' | 'enrollment' | 'commission' | 'document';
};

export type BrokerAlert = {
  id: string;
  title: string;
  description: string;
  href: string;
};

const brokerGroups: BrokerGroup[] = [
  {
    id: 'blue-harbor-logistics',
    groupName: 'Blue Harbor Logistics',
    segment: 'Large group',
    effectiveDate: '2025-05-01',
    renewalDate: '2026-05-01',
    enrolledLives: 1240,
    currentProducts: ['Medical PPO', 'Dental', 'Vision', 'Life'],
    status: 'Renewal in progress',
    region: 'Midwest',
    assignedRep: 'Avery Cole',
    accountManager: 'Jordan Patel',
    lineOfBusiness: 'Full suite',
    alerts: ['Contribution strategy pending', 'Rx disruption review required'],
    carrierAlerts: ['Carrier requested final participation exhibit by Mar 28'],
    mtdCommission: 8420,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Awaiting employer decision',
      decisionDeadline: '2026-03-29',
      rateReleaseDate: '2026-03-12',
      blockers: ['Final contribution split', 'Rx disruption acknowledgement'],
      lastTouchpoint: '2026-03-18'
    },
    enrollmentSummary: {
      status: 'Stable',
      completionRate: 100,
      pendingItems: [],
      lastFileDate: '2025-11-20',
      effectiveDate: '2025-05-01'
    },
    documentsSummary: {
      missingItems: ['Signed renewal acceptance'],
      recentDocuments: ['2026 Renewal Exhibit', 'Rx disruption report']
    },
    plansSummary: [
      {
        carrier: 'Blue Horizon Health',
        planName: 'Choice PPO 4500',
        fundingType: 'Fully insured',
        enrolledEmployees: 428,
        effectiveDate: '2025-05-01'
      },
      {
        carrier: 'Blue Horizon Health',
        planName: 'Dental Premier',
        fundingType: 'Fully insured',
        enrolledEmployees: 396,
        effectiveDate: '2025-05-01'
      }
    ],
    activities: [
      {
        date: '2026-03-18',
        actor: 'Jordan Patel',
        type: 'Renewal',
        description: 'Reviewed contribution options with CFO and HR lead.'
      },
      {
        date: '2026-03-15',
        actor: 'Carrier team',
        type: 'Rates',
        description: 'Renewal rates released with 7.8% increase.'
      }
    ],
    notes: [
      'Client prefers three-rate option with employer contribution held near current budget.',
      'Rx formulary disruption is the main employee communications concern.'
    ]
  },
  {
    id: 'north-coast-retail',
    groupName: 'North Coast Retail',
    segment: 'Mid-market',
    effectiveDate: '2026-04-01',
    renewalDate: '2027-04-01',
    enrolledLives: 420,
    currentProducts: ['Medical HMO', 'Dental'],
    status: 'Enrollment in progress',
    region: 'Midwest',
    assignedRep: 'Avery Cole',
    accountManager: 'Taylor Brooks',
    lineOfBusiness: 'Medical + Dental',
    alerts: ['2 dependent verifications missing', 'Payroll file failed validation'],
    carrierAlerts: ['834 file submission due in 4 days'],
    mtdCommission: 3180,
    commissionStatus: 'Under review',
    renewalSummary: {
      stage: 'New implementation',
      decisionDeadline: '2026-03-26',
      rateReleaseDate: '2026-02-28',
      blockers: ['Dependent verification', 'Payroll class mismatch'],
      lastTouchpoint: '2026-03-19'
    },
    enrollmentSummary: {
      status: 'File in review',
      completionRate: 83,
      pendingItems: ['Resolve 2 dependent verification requests', 'Correct payroll class mapping'],
      lastFileDate: '2026-03-17',
      effectiveDate: '2026-04-01'
    },
    documentsSummary: {
      missingItems: ['Dependent verification documents', 'Final payroll mapping sheet'],
      recentDocuments: ['Initial census', 'Signed application']
    },
    plansSummary: [
      {
        carrier: 'Summit National',
        planName: 'Value HMO 3000',
        fundingType: 'Level funded',
        enrolledEmployees: 147,
        effectiveDate: '2026-04-01'
      }
    ],
    activities: [
      {
        date: '2026-03-19',
        actor: 'Taylor Brooks',
        type: 'Enrollment',
        description: 'Flagged dependent verification documents as urgent.'
      },
      {
        date: '2026-03-16',
        actor: 'Implementation team',
        type: 'File',
        description: 'Returned payroll file for class mismatch correction.'
      }
    ],
    notes: [
      'Client is moving off a regional carrier and needs a tight implementation timeline.',
      'Open issues are operational, not underwriting-related.'
    ]
  },
  {
    id: 'riverview-manufacturing',
    groupName: 'Riverview Manufacturing',
    segment: 'Large group',
    effectiveDate: '2024-06-01',
    renewalDate: '2026-06-01',
    enrolledLives: 2016,
    currentProducts: ['Medical PPO', 'Dental', 'Life', 'Disability'],
    status: 'At risk',
    region: 'Northeast',
    assignedRep: 'Morgan Reyes',
    accountManager: 'Jordan Patel',
    lineOfBusiness: 'Full suite',
    alerts: ['Updated census missing', 'Large claimant review outstanding'],
    carrierAlerts: ['Carrier will not finalize rates without updated census'],
    mtdCommission: 12110,
    commissionStatus: 'Pending adjustment',
    renewalSummary: {
      stage: 'Census outstanding',
      decisionDeadline: '2026-04-04',
      rateReleaseDate: '2026-03-25',
      blockers: ['Updated census', 'Large claimant review confirmation'],
      lastTouchpoint: '2026-03-18'
    },
    enrollmentSummary: {
      status: 'Stable',
      completionRate: 100,
      pendingItems: [],
      lastFileDate: '2025-10-12',
      effectiveDate: '2024-06-01'
    },
    documentsSummary: {
      missingItems: ['Updated census', 'Large claimant narrative'],
      recentDocuments: ['Current plan exhibit', 'Stop-loss disclosure']
    },
    plansSummary: [
      {
        carrier: 'Blue Horizon Health',
        planName: 'Choice PPO 3000',
        fundingType: 'Self funded',
        enrolledEmployees: 688,
        effectiveDate: '2024-06-01'
      }
    ],
    activities: [
      {
        date: '2026-03-18',
        actor: 'Morgan Reyes',
        type: 'Renewal',
        description: 'Escalated missing census request to CFO after two missed deadlines.'
      },
      {
        date: '2026-03-11',
        actor: 'Carrier underwriting',
        type: 'Carrier',
        description: 'Requested large claimant update before releasing terms.'
      }
    ],
    notes: [
      'High urgency group with executive-level visibility.',
      'Potential to market if rates exceed budget tolerance.'
    ]
  },
  {
    id: 'oak-valley-pediatrics',
    groupName: 'Oak Valley Pediatrics',
    segment: 'Small group',
    effectiveDate: '2026-07-01',
    renewalDate: '2027-07-01',
    enrolledLives: 72,
    currentProducts: ['Medical PPO'],
    status: 'Quote in progress',
    region: 'Southeast',
    assignedRep: 'Casey Nguyen',
    accountManager: 'Riley Chen',
    lineOfBusiness: 'Medical',
    alerts: ['Final employee count requested'],
    carrierAlerts: ['Level-funded quote pending census validation'],
    mtdCommission: 420,
    commissionStatus: 'Under review',
    renewalSummary: {
      stage: 'Prospecting',
      decisionDeadline: '2026-04-08',
      rateReleaseDate: '2026-03-27',
      blockers: ['Final employee count', 'Current plan summary'],
      lastTouchpoint: '2026-03-18'
    },
    enrollmentSummary: {
      status: 'Not started',
      completionRate: 0,
      pendingItems: ['Awaiting selected carrier'],
      lastFileDate: '2026-03-10',
      effectiveDate: '2026-07-01'
    },
    documentsSummary: {
      missingItems: ['Current renewal bill', 'Final census'],
      recentDocuments: ['Producer letter', 'Initial quote request']
    },
    plansSummary: [],
    quoteOpportunity: {
      requestedDate: '2026-03-10',
      carriers: ['Blue Horizon Health', 'Summit National'],
      stage: 'Awaiting census validation',
      missingItems: ['Final employee count', 'Current plan summary']
    },
    activities: [
      {
        date: '2026-03-18',
        actor: 'Riley Chen',
        type: 'Quote',
        description: 'Requested final employee count to release level-funded option.'
      }
    ],
    notes: ['New pediatric practice evaluating first fully employer-sponsored plan.']
  },
  {
    id: 'greenfield-dental-associates',
    groupName: 'Greenfield Dental Associates',
    segment: 'Small group',
    effectiveDate: '2026-05-01',
    renewalDate: '2027-05-01',
    enrolledLives: 58,
    currentProducts: ['Medical HSA', 'Dental'],
    status: 'Quote in progress',
    region: 'Midwest',
    assignedRep: 'Casey Nguyen',
    accountManager: 'Riley Chen',
    lineOfBusiness: 'Medical + Dental',
    alerts: ['Proposal due to client Friday'],
    carrierAlerts: ['Waiting on ancillary bundle pricing'],
    mtdCommission: 390,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Quote finalist review',
      decisionDeadline: '2026-03-22',
      rateReleaseDate: '2026-03-15',
      blockers: ['Ancillary bundle pricing'],
      lastTouchpoint: '2026-03-19'
    },
    enrollmentSummary: {
      status: 'Not started',
      completionRate: 0,
      pendingItems: ['Client plan selection pending'],
      lastFileDate: '2026-03-08',
      effectiveDate: '2026-05-01'
    },
    documentsSummary: {
      missingItems: ['Signed proposal acknowledgement'],
      recentDocuments: ['Proposal draft', 'Current carrier plan summary']
    },
    plansSummary: [],
    quoteOpportunity: {
      requestedDate: '2026-03-08',
      carriers: ['Summit National', 'Cobalt Health'],
      stage: 'Proposal preparation',
      missingItems: ['Ancillary bundle pricing']
    },
    activities: [
      {
        date: '2026-03-19',
        actor: 'Casey Nguyen',
        type: 'Quote',
        description: 'Updated client on ancillary bundle timing.'
      }
    ],
    notes: ['Dental practice values predictable HSA contribution modeling.']
  },
  {
    id: 'summit-home-care',
    groupName: 'Summit Home Care',
    segment: 'Mid-market',
    effectiveDate: '2026-04-01',
    renewalDate: '2027-04-01',
    enrolledLives: 512,
    currentProducts: ['Medical PPO', 'Vision', 'Life'],
    status: 'Implementation active',
    region: 'Southeast',
    assignedRep: 'Avery Cole',
    accountManager: 'Taylor Brooks',
    lineOfBusiness: 'Medical + Ancillary',
    alerts: ['Welcome kit not yet approved'],
    carrierAlerts: ['Electronic eligibility feed starts Mar 25'],
    mtdCommission: 2910,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Implementation',
      decisionDeadline: '2026-03-24',
      rateReleaseDate: '2026-02-21',
      blockers: ['Welcome kit approval'],
      lastTouchpoint: '2026-03-17'
    },
    enrollmentSummary: {
      status: '834 build in progress',
      completionRate: 72,
      pendingItems: ['Approve welcome kit', 'Validate payroll deductions'],
      lastFileDate: '2026-03-15',
      effectiveDate: '2026-04-01'
    },
    documentsSummary: {
      missingItems: ['Final welcome kit approval'],
      recentDocuments: ['Implementation timeline', 'Signed plan paperwork']
    },
    plansSummary: [
      {
        carrier: 'Blue Horizon Health',
        planName: 'PPO 5000',
        fundingType: 'Fully insured',
        enrolledEmployees: 189,
        effectiveDate: '2026-04-01'
      }
    ],
    activities: [
      {
        date: '2026-03-17',
        actor: 'Taylor Brooks',
        type: 'Implementation',
        description: 'Uploaded implementation timeline and confirmed payroll testing.'
      }
    ],
    notes: ['Fast-moving implementation with strong HR partner engagement.']
  },
  {
    id: 'horizon-fabrication',
    groupName: 'Horizon Fabrication',
    segment: 'Large group',
    effectiveDate: '2025-08-01',
    renewalDate: '2026-08-01',
    enrolledLives: 1688,
    currentProducts: ['Medical PPO', 'Dental', 'Vision'],
    status: 'Active',
    region: 'Midwest',
    assignedRep: 'Morgan Reyes',
    accountManager: 'Jordan Patel',
    lineOfBusiness: 'Full suite',
    alerts: ['Wellness credit reconciliation due next month'],
    carrierAlerts: ['No immediate carrier actions'],
    mtdCommission: 9750,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Stable',
      decisionDeadline: '2026-05-15',
      rateReleaseDate: '2026-04-20',
      blockers: [],
      lastTouchpoint: '2026-03-07'
    },
    enrollmentSummary: {
      status: 'Stable',
      completionRate: 100,
      pendingItems: [],
      lastFileDate: '2025-11-12',
      effectiveDate: '2025-08-01'
    },
    documentsSummary: {
      missingItems: [],
      recentDocuments: ['Wellness credit report', 'Quarterly utilization review']
    },
    plansSummary: [
      {
        carrier: 'Cobalt Health',
        planName: 'PPO 3500',
        fundingType: 'Self funded',
        enrolledEmployees: 581,
        effectiveDate: '2025-08-01'
      }
    ],
    activities: [
      {
        date: '2026-03-07',
        actor: 'Jordan Patel',
        type: 'Service',
        description: 'Sent quarterly utilization review to CFO.'
      }
    ],
    notes: ['Healthy ongoing account with predictable service cadence.']
  },
  {
    id: 'lakeside-union-health',
    groupName: 'Lakeside Union Health',
    segment: 'National account',
    effectiveDate: '2025-01-01',
    renewalDate: '2027-01-01',
    enrolledLives: 4210,
    currentProducts: ['Medical PPO', 'Pharmacy', 'Dental'],
    status: 'Active',
    region: 'Northeast',
    assignedRep: 'Morgan Reyes',
    accountManager: 'Jordan Patel',
    lineOfBusiness: 'Medical + Dental',
    alerts: ['Stop-loss market review scheduled Q3'],
    carrierAlerts: ['Pharmacy rebate true-up due month end'],
    mtdCommission: 22150,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Stable',
      decisionDeadline: '2026-10-01',
      rateReleaseDate: '2026-09-05',
      blockers: [],
      lastTouchpoint: '2026-03-14'
    },
    enrollmentSummary: {
      status: 'Stable',
      completionRate: 100,
      pendingItems: [],
      lastFileDate: '2025-12-14',
      effectiveDate: '2025-01-01'
    },
    documentsSummary: {
      missingItems: [],
      recentDocuments: ['Pharmacy rebate summary', 'Union committee meeting notes']
    },
    plansSummary: [
      {
        carrier: 'Summit National',
        planName: 'National PPO 2000',
        fundingType: 'Self funded',
        enrolledEmployees: 1360,
        effectiveDate: '2025-01-01'
      }
    ],
    activities: [
      {
        date: '2026-03-14',
        actor: 'Morgan Reyes',
        type: 'Account',
        description: 'Prepared Q2 governance agenda with union committee chair.'
      }
    ],
    notes: ['Complex national account with labor governance touchpoints.']
  },
  {
    id: 'prairie-state-grocers',
    groupName: 'Prairie State Grocers',
    segment: 'Mid-market',
    effectiveDate: '2025-09-01',
    renewalDate: '2026-09-01',
    enrolledLives: 934,
    currentProducts: ['Medical HMO', 'Dental', 'Vision'],
    status: 'Active',
    region: 'Midwest',
    assignedRep: 'Avery Cole',
    accountManager: 'Taylor Brooks',
    lineOfBusiness: 'Full suite',
    alerts: ['Dependent audit scheduled'],
    carrierAlerts: ['Carrier requested dependent audit kickoff roster'],
    mtdCommission: 6410,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Pre-renewal planning',
      decisionDeadline: '2026-06-20',
      rateReleaseDate: '2026-05-30',
      blockers: ['Dependent audit kickoff roster'],
      lastTouchpoint: '2026-03-13'
    },
    enrollmentSummary: {
      status: 'Stable',
      completionRate: 100,
      pendingItems: [],
      lastFileDate: '2025-11-05',
      effectiveDate: '2025-09-01'
    },
    documentsSummary: {
      missingItems: ['Dependent audit kickoff roster'],
      recentDocuments: ['Current SBCs', 'Store class census']
    },
    plansSummary: [
      {
        carrier: 'Blue Horizon Health',
        planName: 'Regional HMO 2500',
        fundingType: 'Fully insured',
        enrolledEmployees: 372,
        effectiveDate: '2025-09-01'
      }
    ],
    activities: [
      {
        date: '2026-03-13',
        actor: 'Taylor Brooks',
        type: 'Renewal',
        description: 'Reviewed dependent audit readiness with HR operations.'
      }
    ],
    notes: ['Store turnover makes dependent eligibility audits important each year.']
  },
  {
    id: 'cedar-orthopedic-partners',
    groupName: 'Cedar Orthopedic Partners',
    segment: 'Small group',
    effectiveDate: '2026-06-01',
    renewalDate: '2027-06-01',
    enrolledLives: 84,
    currentProducts: ['Medical PPO', 'Dental'],
    status: 'Quote in progress',
    region: 'West',
    assignedRep: 'Casey Nguyen',
    accountManager: 'Riley Chen',
    lineOfBusiness: 'Medical + Dental',
    alerts: ['Carrier participation confirmation pending'],
    carrierAlerts: ['Out-of-area dependent review requested'],
    mtdCommission: 515,
    commissionStatus: 'Under review',
    renewalSummary: {
      stage: 'Carrier finalist review',
      decisionDeadline: '2026-04-02',
      rateReleaseDate: '2026-03-20',
      blockers: ['Out-of-area dependent review'],
      lastTouchpoint: '2026-03-18'
    },
    enrollmentSummary: {
      status: 'Not started',
      completionRate: 0,
      pendingItems: ['Awaiting carrier selection'],
      lastFileDate: '2026-03-09',
      effectiveDate: '2026-06-01'
    },
    documentsSummary: {
      missingItems: ['Current renewal bill'],
      recentDocuments: ['Proposal deck', 'Current census']
    },
    plansSummary: [],
    quoteOpportunity: {
      requestedDate: '2026-03-09',
      carriers: ['Blue Horizon Health', 'Redwood Benefit Partners'],
      stage: 'Carrier finalist review',
      missingItems: ['Out-of-area dependent review']
    },
    activities: [
      {
        date: '2026-03-18',
        actor: 'Riley Chen',
        type: 'Quote',
        description: 'Confirmed finalist carriers and flagged dependent location issue.'
      }
    ],
    notes: ['Physician-owned practice with tight carrier access expectations.']
  },
  {
    id: 'riverbend-municipal-services',
    groupName: 'Riverbend Municipal Services',
    segment: 'Large group',
    effectiveDate: '2025-07-01',
    renewalDate: '2026-07-01',
    enrolledLives: 1876,
    currentProducts: ['Medical PPO', 'Dental', 'Vision', 'Life'],
    status: 'Renewal in progress',
    region: 'Southeast',
    assignedRep: 'Morgan Reyes',
    accountManager: 'Jordan Patel',
    lineOfBusiness: 'Full suite',
    alerts: ['Budget approval pending', 'Union contribution language under review'],
    carrierAlerts: ['Carrier needs final class structure by Apr 3'],
    mtdCommission: 10940,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Budget review',
      decisionDeadline: '2026-04-03',
      rateReleaseDate: '2026-03-18',
      blockers: ['Budget approval', 'Union contribution language'],
      lastTouchpoint: '2026-03-19'
    },
    enrollmentSummary: {
      status: 'Stable',
      completionRate: 100,
      pendingItems: [],
      lastFileDate: '2025-11-01',
      effectiveDate: '2025-07-01'
    },
    documentsSummary: {
      missingItems: ['Union contribution language approval'],
      recentDocuments: ['Renewal rates', 'Budget worksheet']
    },
    plansSummary: [
      {
        carrier: 'Cobalt Health',
        planName: 'Municipal PPO 2500',
        fundingType: 'Fully insured',
        enrolledEmployees: 604,
        effectiveDate: '2025-07-01'
      }
    ],
    activities: [
      {
        date: '2026-03-19',
        actor: 'Jordan Patel',
        type: 'Renewal',
        description: 'Met with finance team to review budget scenarios.'
      }
    ],
    notes: ['Municipal cycle depends on public board approval timing.']
  },
  {
    id: 'harborview-hospitality-group',
    groupName: 'Harborview Hospitality Group',
    segment: 'Mid-market',
    effectiveDate: '2026-05-01',
    renewalDate: '2027-05-01',
    enrolledLives: 688,
    currentProducts: ['Medical HMO', 'Dental', 'Vision'],
    status: 'Enrollment in progress',
    region: 'West',
    assignedRep: 'Avery Cole',
    accountManager: 'Taylor Brooks',
    lineOfBusiness: 'Full suite',
    alerts: ['Spanish OE materials requested', 'Dependent ages need verification'],
    carrierAlerts: ['Enrollment guide must be approved this week'],
    mtdCommission: 4725,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Implementation',
      decisionDeadline: '2026-03-25',
      rateReleaseDate: '2026-03-01',
      blockers: ['Bilingual enrollment materials', 'Dependent age verification'],
      lastTouchpoint: '2026-03-18'
    },
    enrollmentSummary: {
      status: 'Guide approval pending',
      completionRate: 76,
      pendingItems: ['Approve Spanish OE guide', 'Resolve 5 age verifications'],
      lastFileDate: '2026-03-16',
      effectiveDate: '2026-05-01'
    },
    documentsSummary: {
      missingItems: ['Spanish enrollment guide approval'],
      recentDocuments: ['OE guide draft', 'Eligibility roster']
    },
    plansSummary: [
      {
        carrier: 'Summit National',
        planName: 'Regional HMO 4000',
        fundingType: 'Fully insured',
        enrolledEmployees: 251,
        effectiveDate: '2026-05-01'
      }
    ],
    activities: [
      {
        date: '2026-03-18',
        actor: 'Taylor Brooks',
        type: 'Enrollment',
        description: 'Sent revised bilingual open enrollment guide for approval.'
      }
    ],
    notes: ['High hourly workforce needs bilingual communications support.']
  },
  {
    id: 'sterling-pharma-distribution',
    groupName: 'Sterling Pharma Distribution',
    segment: 'National account',
    effectiveDate: '2025-10-01',
    renewalDate: '2026-10-01',
    enrolledLives: 2865,
    currentProducts: ['Medical PPO', 'Pharmacy', 'Dental', 'Vision'],
    status: 'Active',
    region: 'Northeast',
    assignedRep: 'Morgan Reyes',
    accountManager: 'Jordan Patel',
    lineOfBusiness: 'Full suite',
    alerts: ['Clinical management review scheduled'],
    carrierAlerts: ['No immediate action'],
    mtdCommission: 18360,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Pre-renewal planning',
      decisionDeadline: '2026-07-08',
      rateReleaseDate: '2026-06-10',
      blockers: [],
      lastTouchpoint: '2026-03-12'
    },
    enrollmentSummary: {
      status: 'Stable',
      completionRate: 100,
      pendingItems: [],
      lastFileDate: '2025-12-08',
      effectiveDate: '2025-10-01'
    },
    documentsSummary: {
      missingItems: [],
      recentDocuments: ['Clinical utilization review', 'Pharmacy trend report']
    },
    plansSummary: [
      {
        carrier: 'Blue Horizon Health',
        planName: 'National PPO 1500',
        fundingType: 'Self funded',
        enrolledEmployees: 921,
        effectiveDate: '2025-10-01'
      }
    ],
    activities: [
      {
        date: '2026-03-12',
        actor: 'Morgan Reyes',
        type: 'Account',
        description: 'Scheduled clinical management review with benefits committee.'
      }
    ],
    notes: ['Pharmacy strategy is a major decision lever for this account.']
  },
  {
    id: 'maple-county-schools',
    groupName: 'Maple County Schools',
    segment: 'Large group',
    effectiveDate: '2025-09-01',
    renewalDate: '2026-09-01',
    enrolledLives: 2438,
    currentProducts: ['Medical PPO', 'Dental', 'Vision'],
    status: 'Renewal in progress',
    region: 'Midwest',
    assignedRep: 'Avery Cole',
    accountManager: 'Taylor Brooks',
    lineOfBusiness: 'Full suite',
    alerts: ['Board meeting decision pending', 'Plan mapping requested'],
    carrierAlerts: ['Alternative funding option released for review'],
    mtdCommission: 14420,
    commissionStatus: 'Pending adjustment',
    renewalSummary: {
      stage: 'Board review',
      decisionDeadline: '2026-04-14',
      rateReleaseDate: '2026-03-21',
      blockers: ['Board meeting decision', 'Plan mapping review'],
      lastTouchpoint: '2026-03-18'
    },
    enrollmentSummary: {
      status: 'Stable',
      completionRate: 100,
      pendingItems: [],
      lastFileDate: '2025-11-22',
      effectiveDate: '2025-09-01'
    },
    documentsSummary: {
      missingItems: ['Board meeting agenda packet'],
      recentDocuments: ['Board renewal deck', 'Plan mapping exhibit']
    },
    plansSummary: [
      {
        carrier: 'Blue Horizon Health',
        planName: 'Education PPO 2000',
        fundingType: 'Fully insured',
        enrolledEmployees: 801,
        effectiveDate: '2025-09-01'
      }
    ],
    activities: [
      {
        date: '2026-03-18',
        actor: 'Avery Cole',
        type: 'Renewal',
        description: 'Prepared board-facing renewal deck with mapped plan options.'
      }
    ],
    notes: ['Public meeting calendar drives renewal pacing.']
  },
  {
    id: 'coastal-tech-solutions',
    groupName: 'Coastal Tech Solutions',
    segment: 'Mid-market',
    effectiveDate: '2026-08-01',
    renewalDate: '2027-08-01',
    enrolledLives: 346,
    currentProducts: ['Medical HSA', 'Dental', 'Vision', 'Life'],
    status: 'Quote in progress',
    region: 'West',
    assignedRep: 'Casey Nguyen',
    accountManager: 'Riley Chen',
    lineOfBusiness: 'Full suite',
    alerts: ['Telehealth carve-out requested'],
    carrierAlerts: ['Carrier needs census payroll frequency'],
    mtdCommission: 1630,
    commissionStatus: 'Under review',
    renewalSummary: {
      stage: 'Marketing',
      decisionDeadline: '2026-04-12',
      rateReleaseDate: '2026-03-29',
      blockers: ['Telehealth carve-out review', 'Payroll frequency confirmation'],
      lastTouchpoint: '2026-03-19'
    },
    enrollmentSummary: {
      status: 'Not started',
      completionRate: 0,
      pendingItems: ['Awaiting client finalist decision'],
      lastFileDate: '2026-03-11',
      effectiveDate: '2026-08-01'
    },
    documentsSummary: {
      missingItems: ['Payroll frequency confirmation'],
      recentDocuments: ['Tech employer census', 'Current plan designs']
    },
    plansSummary: [],
    quoteOpportunity: {
      requestedDate: '2026-03-11',
      carriers: ['Cobalt Health', 'Summit National', 'Blue Horizon Health'],
      stage: 'Marketing',
      missingItems: ['Telehealth carve-out review', 'Payroll frequency confirmation']
    },
    activities: [
      {
        date: '2026-03-19',
        actor: 'Casey Nguyen',
        type: 'Quote',
        description: 'Collected telehealth carve-out request from HR director.'
      }
    ],
    notes: ['Tech client is comparing broad national access and virtual care options.']
  },
  {
    id: 'pinecrest-senior-living',
    groupName: 'Pinecrest Senior Living',
    segment: 'Mid-market',
    effectiveDate: '2026-04-01',
    renewalDate: '2027-04-01',
    enrolledLives: 602,
    currentProducts: ['Medical PPO', 'Dental', 'Life'],
    status: 'Implementation active',
    region: 'Southeast',
    assignedRep: 'Avery Cole',
    accountManager: 'Taylor Brooks',
    lineOfBusiness: 'Medical + Ancillary',
    alerts: ['EOI file pending for voluntary life'],
    carrierAlerts: ['Life carrier needs EOI census by Mar 27'],
    mtdCommission: 3375,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Implementation',
      decisionDeadline: '2026-03-27',
      rateReleaseDate: '2026-02-24',
      blockers: ['EOI file for voluntary life'],
      lastTouchpoint: '2026-03-18'
    },
    enrollmentSummary: {
      status: 'Carrier setup in progress',
      completionRate: 79,
      pendingItems: ['Submit EOI file', 'Finalize benefit guide'],
      lastFileDate: '2026-03-14',
      effectiveDate: '2026-04-01'
    },
    documentsSummary: {
      missingItems: ['EOI file'],
      recentDocuments: ['Benefit guide draft', 'Ancillary implementation form']
    },
    plansSummary: [
      {
        carrier: 'Blue Horizon Health',
        planName: 'PPO 4000',
        fundingType: 'Fully insured',
        enrolledEmployees: 223,
        effectiveDate: '2026-04-01'
      }
    ],
    activities: [
      {
        date: '2026-03-18',
        actor: 'Taylor Brooks',
        type: 'Implementation',
        description: 'Requested final EOI file for voluntary life setup.'
      }
    ],
    notes: ['Ancillary rollout is the main dependency for go-live readiness.']
  },
  {
    id: 'ironwood-transit-services',
    groupName: 'Ironwood Transit Services',
    segment: 'Large group',
    effectiveDate: '2025-11-01',
    renewalDate: '2026-11-01',
    enrolledLives: 1544,
    currentProducts: ['Medical PPO', 'Dental', 'Vision'],
    status: 'Active',
    region: 'Southwest',
    assignedRep: 'Morgan Reyes',
    accountManager: 'Jordan Patel',
    lineOfBusiness: 'Medical + Dental',
    alerts: ['Union eligibility audit slated for Q2'],
    carrierAlerts: ['No immediate action'],
    mtdCommission: 11320,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Stable',
      decisionDeadline: '2026-08-10',
      rateReleaseDate: '2026-07-15',
      blockers: [],
      lastTouchpoint: '2026-03-10'
    },
    enrollmentSummary: {
      status: 'Stable',
      completionRate: 100,
      pendingItems: [],
      lastFileDate: '2025-12-03',
      effectiveDate: '2025-11-01'
    },
    documentsSummary: {
      missingItems: [],
      recentDocuments: ['Union eligibility audit scope', 'Quarterly service report']
    },
    plansSummary: [
      {
        carrier: 'Cobalt Health',
        planName: 'Transit PPO 3000',
        fundingType: 'Fully insured',
        enrolledEmployees: 513,
        effectiveDate: '2025-11-01'
      }
    ],
    activities: [
      {
        date: '2026-03-10',
        actor: 'Jordan Patel',
        type: 'Service',
        description: 'Delivered quarterly service report to labor relations lead.'
      }
    ],
    notes: ['Operationally steady account with union audit seasonality.']
  },
  {
    id: 'willow-creek-banking',
    groupName: 'Willow Creek Banking',
    segment: 'Mid-market',
    effectiveDate: '2026-06-01',
    renewalDate: '2027-06-01',
    enrolledLives: 418,
    currentProducts: ['Medical HSA', 'Dental', 'Vision'],
    status: 'Quote in progress',
    region: 'Northeast',
    assignedRep: 'Casey Nguyen',
    accountManager: 'Riley Chen',
    lineOfBusiness: 'Full suite',
    alerts: ['Reference-based pricing option requested'],
    carrierAlerts: ['Current claims experience needed for final modeling'],
    mtdCommission: 1880,
    commissionStatus: 'Pending adjustment',
    renewalSummary: {
      stage: 'Alternative modeling',
      decisionDeadline: '2026-04-18',
      rateReleaseDate: '2026-04-02',
      blockers: ['Current claims experience'],
      lastTouchpoint: '2026-03-18'
    },
    enrollmentSummary: {
      status: 'Not started',
      completionRate: 0,
      pendingItems: ['Awaiting alternative modeling'],
      lastFileDate: '2026-03-12',
      effectiveDate: '2026-06-01'
    },
    documentsSummary: {
      missingItems: ['Current claims experience report'],
      recentDocuments: ['Census', 'Current SBCs']
    },
    plansSummary: [],
    quoteOpportunity: {
      requestedDate: '2026-03-12',
      carriers: ['Summit National', 'Blue Horizon Health'],
      stage: 'Alternative modeling',
      missingItems: ['Current claims experience report']
    },
    activities: [
      {
        date: '2026-03-18',
        actor: 'Riley Chen',
        type: 'Quote',
        description: 'Requested current claims experience for alternative funding model.'
      }
    ],
    notes: ['Finance team is highly cost-focused and wants scenario modeling.']
  },
  {
    id: 'evergreen-foods-cooperative',
    groupName: 'Evergreen Foods Cooperative',
    segment: 'Small group',
    effectiveDate: '2025-12-01',
    renewalDate: '2026-12-01',
    enrolledLives: 96,
    currentProducts: ['Medical HMO', 'Dental'],
    status: 'Active',
    region: 'West',
    assignedRep: 'Casey Nguyen',
    accountManager: 'Riley Chen',
    lineOfBusiness: 'Medical + Dental',
    alerts: ['Open service case for newborn addition'],
    carrierAlerts: ['No immediate action'],
    mtdCommission: 640,
    commissionStatus: 'Posted',
    renewalSummary: {
      stage: 'Stable',
      decisionDeadline: '2026-09-01',
      rateReleaseDate: '2026-08-08',
      blockers: [],
      lastTouchpoint: '2026-03-16'
    },
    enrollmentSummary: {
      status: 'Service case open',
      completionRate: 98,
      pendingItems: ['Resolve newborn addition service case'],
      lastFileDate: '2026-03-15',
      effectiveDate: '2025-12-01'
    },
    documentsSummary: {
      missingItems: [],
      recentDocuments: ['Service request', 'Updated eligibility roster']
    },
    plansSummary: [
      {
        carrier: 'Summit National',
        planName: 'Regional HMO 2000',
        fundingType: 'Fully insured',
        enrolledEmployees: 34,
        effectiveDate: '2025-12-01'
      }
    ],
    activities: [
      {
        date: '2026-03-16',
        actor: 'Riley Chen',
        type: 'Service',
        description: 'Opened newborn addition case with carrier service desk.'
      }
    ],
    notes: ['Small cooperative with straightforward service needs.']
  },
  {
    id: 'granite-distribution-holdings',
    groupName: 'Granite Distribution Holdings',
    segment: 'National account',
    effectiveDate: '2025-03-01',
    renewalDate: '2026-03-01',
    enrolledLives: 3654,
    currentProducts: ['Medical PPO', 'Dental', 'Vision', 'Disability'],
    status: 'At risk',
    region: 'Southwest',
    assignedRep: 'Morgan Reyes',
    accountManager: 'Jordan Patel',
    lineOfBusiness: 'Full suite',
    alerts: ['Renewal past due', 'Carrier escalation open'],
    carrierAlerts: ['Carrier extension expires Mar 22'],
    mtdCommission: 20480,
    commissionStatus: 'Under review',
    renewalSummary: {
      stage: 'Late decision risk',
      decisionDeadline: '2026-03-22',
      rateReleaseDate: '2026-02-14',
      blockers: ['Final executive decision', 'Carrier extension approval'],
      lastTouchpoint: '2026-03-19'
    },
    enrollmentSummary: {
      status: 'At risk',
      completionRate: 48,
      pendingItems: ['Finalize carrier decision', 'Release implementation kickoff'],
      lastFileDate: '2026-03-04',
      effectiveDate: '2026-04-01'
    },
    documentsSummary: {
      missingItems: ['Signed extension approval', 'Final executive decision memo'],
      recentDocuments: ['Rate comparison', 'Executive recommendation']
    },
    plansSummary: [
      {
        carrier: 'Blue Horizon Health',
        planName: 'National PPO 2500',
        fundingType: 'Self funded',
        enrolledEmployees: 1188,
        effectiveDate: '2025-03-01'
      }
    ],
    activities: [
      {
        date: '2026-03-19',
        actor: 'Morgan Reyes',
        type: 'Escalation',
        description: 'Escalated carrier extension request after executive decision slipped.'
      }
    ],
    notes: ['High-visibility renewal with compressed timeline and executive scrutiny.']
  }
];

const brokerTasks: BrokerTask[] = [
  {
    id: 'task-1',
    groupId: 'riverview-manufacturing',
    title: 'Riverview Manufacturing census update overdue',
    detail: 'Carrier rates cannot be finalized until the updated census and large claimant narrative are received.',
    status: 'Needs review',
    dueDate: '2026-03-22',
    href: '/broker/book-of-business/riverview-manufacturing',
    category: 'renewal'
  },
  {
    id: 'task-2',
    groupId: 'granite-distribution-holdings',
    title: 'Granite Distribution renewal decision at risk',
    detail: 'Carrier extension expires this week and executive sign-off is still outstanding.',
    status: 'Action required',
    dueDate: '2026-03-22',
    href: '/broker/book-of-business/granite-distribution-holdings',
    category: 'renewal'
  },
  {
    id: 'task-3',
    groupId: 'oak-valley-pediatrics',
    title: 'Oak Valley Pediatrics quote missing final census',
    detail: 'Need final employee count to release the level-funded option and underwriting assumptions.',
    status: 'Pending client',
    dueDate: '2026-03-25',
    href: '/broker/book-of-business/oak-valley-pediatrics',
    category: 'quote'
  },
  {
    id: 'task-4',
    groupId: 'north-coast-retail',
    title: 'North Coast Retail dependent verification open',
    detail: 'Two dependent verifications and one payroll mapping issue are delaying file release.',
    status: 'Needs review',
    dueDate: '2026-03-23',
    href: '/broker/book-of-business/north-coast-retail',
    category: 'enrollment'
  },
  {
    id: 'task-5',
    groupId: 'pinecrest-senior-living',
    title: 'Pinecrest voluntary life EOI file pending',
    detail: 'Ancillary setup cannot be completed until the EOI file is delivered to the carrier.',
    status: 'Action required',
    dueDate: '2026-03-27',
    href: '/broker/book-of-business/pinecrest-senior-living',
    category: 'document'
  },
  {
    id: 'task-6',
    groupId: 'maple-county-schools',
    title: 'Maple County Schools board deck needs final approval',
    detail: 'Renewal presentation is ready, but the board packet is missing the final finance appendix.',
    status: 'Pending review',
    dueDate: '2026-03-28',
    href: '/broker/book-of-business/maple-county-schools',
    category: 'renewal'
  },
  {
    id: 'task-7',
    groupId: 'blue-harbor-logistics',
    title: 'Blue Harbor contribution split still open',
    detail: 'Client asked for a final cost share comparison before signing renewal acceptance.',
    status: 'Pending client',
    dueDate: '2026-03-29',
    href: '/broker/book-of-business/blue-harbor-logistics',
    category: 'renewal'
  },
  {
    id: 'task-8',
    groupId: 'willow-creek-banking',
    title: 'Willow Creek claims experience report requested',
    detail: 'Alternative funding model cannot move forward until claims experience is delivered.',
    status: 'Needs review',
    dueDate: '2026-03-31',
    href: '/broker/book-of-business/willow-creek-banking',
    category: 'quote'
  }
];

const brokerAlerts: BrokerAlert[] = [
  {
    id: 'alert-1',
    title: 'Carrier rate release watch',
    description: 'Three carriers are releasing final April and May renewal terms this week.',
    href: '/broker/renewals'
  },
  {
    id: 'alert-2',
    title: 'Commission exceptions',
    description: 'Two statements remain under review because broker of record files do not match expected splits.',
    href: '/broker/commissions'
  },
  {
    id: 'alert-3',
    title: 'Missing census or documents',
    description: 'Five groups have missing census, board packets, or signed paperwork blocking next steps.',
    href: '/broker/documents'
  },
  {
    id: 'alert-4',
    title: 'Broker enablement',
    description: 'Updated Q2 renewal timeline and implementation handoff guide are available for your team.',
    href: '/broker/support'
  }
];

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function monthName(value: string) {
  return parseDate(value).toLocaleDateString('en-US', { month: 'long' });
}

export function getBrokerPortfolioGroups() {
  return brokerGroups;
}

export function getBrokerPortfolioGroup(groupId: string) {
  return brokerGroups.find((group) => group.id === groupId) ?? null;
}

export function getBrokerTasks() {
  return brokerTasks;
}

export function getBrokerAlerts() {
  return brokerAlerts;
}

export function getBrokerFilterOptions() {
  return {
    renewalMonths: Array.from(new Set(brokerGroups.map((group) => monthName(group.renewalDate)))).sort(),
    linesOfBusiness: Array.from(new Set(brokerGroups.map((group) => group.lineOfBusiness))).sort(),
    statuses: Array.from(new Set(brokerGroups.map((group) => group.status))).sort(),
    regions: Array.from(new Set(brokerGroups.map((group) => group.region))).sort(),
    assignedReps: Array.from(new Set(brokerGroups.map((group) => group.assignedRep))).sort()
  };
}

export function getBrokerDashboardSnapshot() {
  const today = parseDate('2026-03-19');
  const renewalsDue = brokerGroups.filter((group) => {
    const renewalDate = parseDate(group.renewalDate);
    const diffDays = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= -30 && diffDays <= 120;
  });
  const openQuotes = brokerGroups.filter((group) => group.quoteOpportunity);
  const enrollmentsInProgress = brokerGroups.filter((group) =>
    group.status === 'Enrollment in progress' || group.status === 'Implementation active'
  );
  const recentActivity = brokerGroups
    .flatMap((group) =>
      group.activities.map((activity) => ({
        ...activity,
        groupId: group.id,
        groupName: group.groupName
      }))
    )
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 8);

  const mtdCommissions = brokerGroups.reduce((sum, group) => sum + group.mtdCommission, 0);
  const commissionExceptions = brokerGroups.filter(
    (group) => group.commissionStatus !== 'Posted'
  );

  return {
    groups: brokerGroups,
    tasks: brokerTasks,
    alerts: brokerAlerts,
    kpis: {
      assignedGroups: brokerGroups.length,
      renewalsDue: renewalsDue.length,
      openQuotes: openQuotes.length,
      enrollmentsInProgress: enrollmentsInProgress.length,
      pendingTasks: brokerTasks.length,
      mtdCommissions
    },
    renewalsNeedingAction: brokerGroups
      .filter((group) => group.renewalSummary.blockers.length > 0)
      .sort((left, right) =>
        left.renewalSummary.decisionDeadline.localeCompare(right.renewalSummary.decisionDeadline)
      )
      .slice(0, 5),
    openQuoteGroups: openQuotes.slice(0, 5),
    enrollmentIssues: enrollmentsInProgress
      .filter((group) => group.enrollmentSummary.pendingItems.length > 0)
      .sort(
        (left, right) =>
          right.enrollmentSummary.pendingItems.length - left.enrollmentSummary.pendingItems.length
      )
      .slice(0, 5),
    recentActivity,
    commissionSnapshot: {
      mtdCommissions,
      postedGroups: brokerGroups.filter((group) => group.commissionStatus === 'Posted').length,
      exceptions: commissionExceptions.length,
      pendingValue: commissionExceptions.reduce((sum, group) => sum + group.mtdCommission, 0)
    }
  };
}
