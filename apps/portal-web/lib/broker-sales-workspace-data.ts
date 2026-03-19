import {
  getBrokerAlerts,
  getBrokerPortfolioGroup,
  getBrokerPortfolioGroups,
  getBrokerTasks
} from './broker-portfolio-data';

export type BrokerQuoteStatus =
  | 'Draft'
  | 'Census Needed'
  | 'In Review'
  | 'Proposal Ready'
  | 'Presented'
  | 'Sold'
  | 'Closed Lost';

export type BrokerRenewalStatus =
  | 'Not Started'
  | 'Awaiting Rates'
  | 'In Review'
  | 'Employer Review'
  | 'Decision Pending'
  | 'Accepted'
  | 'Declined';

export type BrokerQuote = {
  id: string;
  prospectOrEmployerName: string;
  groupId?: string;
  marketSegment: string;
  effectiveDateTarget: string;
  productsRequested: string[];
  censusStatus: 'Pending' | 'Uploaded' | 'Validated';
  lastUpdated: string;
  assignedBrokerRep: string;
  status: BrokerQuoteStatus;
  coverageTiers: string[];
  proposalSummary: string;
  notes: string[];
  nextActions: string[];
};

export type BrokerRenewal = {
  id: string;
  groupId: string;
  groupName: string;
  marketSegment: string;
  renewalDate: string;
  daysUntilRenewal: number;
  status: BrokerRenewalStatus;
  currentPlanSummary: {
    carrier: string;
    planName: string;
    monthlyPremium: number;
    fundingType: string;
  };
  proposedPlanSummary: {
    carrier: string;
    planName: string;
    monthlyPremium: number;
    fundingType: string;
  };
  contributionImpactSummary: {
    employeeOnly: string;
    employeeSpouse: string;
    family: string;
  };
  checklist: Array<{
    label: string;
    completed: boolean;
  }>;
  documentsNeeded: string[];
  nextActions: string[];
  rateChangeSummary: {
    currentMonthlyPremium: number;
    proposedMonthlyPremium: number;
    rateChangePercent: number;
  };
};

const brokerQuotes: BrokerQuote[] = [
  {
    id: 'quote-oak-valley-pediatrics',
    prospectOrEmployerName: 'Oak Valley Pediatrics',
    groupId: 'oak-valley-pediatrics',
    marketSegment: 'Small group',
    effectiveDateTarget: '2026-07-01',
    productsRequested: ['Medical', 'Dental'],
    censusStatus: 'Pending',
    lastUpdated: '2026-03-18',
    assignedBrokerRep: 'Casey Nguyen',
    status: 'Census Needed',
    coverageTiers: ['Employee only', 'Employee + child', 'Family'],
    proposalSummary: 'Level-funded and fully insured options are scoped once final headcount is confirmed.',
    notes: ['Client requested employee contribution scenarios before final marketing.'],
    nextActions: ['Collect final employee count', 'Request current renewal bill', 'Release carrier finalist review']
  },
  {
    id: 'quote-greenfield-dental-associates',
    prospectOrEmployerName: 'Greenfield Dental Associates',
    groupId: 'greenfield-dental-associates',
    marketSegment: 'Small group',
    effectiveDateTarget: '2026-05-01',
    productsRequested: ['Medical', 'Dental'],
    censusStatus: 'Uploaded',
    lastUpdated: '2026-03-19',
    assignedBrokerRep: 'Casey Nguyen',
    status: 'Proposal Ready',
    coverageTiers: ['Employee only', 'Employee + spouse', 'Family'],
    proposalSummary: 'Two finalist carriers are priced and the proposal deck is ready for broker review.',
    notes: ['Ancillary bundle pricing landed and is included in the proposal appendix.'],
    nextActions: ['Review proposal deck', 'Schedule client presentation', 'Confirm decision timeline']
  },
  {
    id: 'quote-cedar-orthopedic-partners',
    prospectOrEmployerName: 'Cedar Orthopedic Partners',
    groupId: 'cedar-orthopedic-partners',
    marketSegment: 'Small group',
    effectiveDateTarget: '2026-06-01',
    productsRequested: ['Medical', 'Dental'],
    censusStatus: 'Uploaded',
    lastUpdated: '2026-03-18',
    assignedBrokerRep: 'Casey Nguyen',
    status: 'In Review',
    coverageTiers: ['Employee only', 'Employee + spouse', 'Family'],
    proposalSummary: 'Carrier finalist review is underway pending out-of-area dependent approval.',
    notes: ['Broker expects client to prefer PPO access with broad ortho specialist coverage.'],
    nextActions: ['Resolve out-of-area dependent review', 'Finalize carrier recommendation']
  },
  {
    id: 'quote-coastal-tech-solutions',
    prospectOrEmployerName: 'Coastal Tech Solutions',
    groupId: 'coastal-tech-solutions',
    marketSegment: 'Mid-market',
    effectiveDateTarget: '2026-08-01',
    productsRequested: ['Medical', 'Dental', 'Vision', 'Life'],
    censusStatus: 'Validated',
    lastUpdated: '2026-03-19',
    assignedBrokerRep: 'Casey Nguyen',
    status: 'Presented',
    coverageTiers: ['Employee only', 'Employee + spouse', 'Employee + child', 'Family'],
    proposalSummary: 'Three-carrier comparison has been presented with virtual care carve-out considerations.',
    notes: ['Client is comparing national access, telehealth, and HSA contribution strategy.'],
    nextActions: ['Collect finalist feedback', 'Prepare follow-up cost scenarios']
  },
  {
    id: 'quote-willow-creek-banking',
    prospectOrEmployerName: 'Willow Creek Banking',
    groupId: 'willow-creek-banking',
    marketSegment: 'Mid-market',
    effectiveDateTarget: '2026-06-01',
    productsRequested: ['Medical', 'Dental', 'Vision'],
    censusStatus: 'Uploaded',
    lastUpdated: '2026-03-18',
    assignedBrokerRep: 'Casey Nguyen',
    status: 'In Review',
    coverageTiers: ['Employee only', 'Employee + spouse', 'Family'],
    proposalSummary: 'Alternative funding model is being revised once claims experience is loaded.',
    notes: ['Finance team wants claims-based scenario modeling before presentation.'],
    nextActions: ['Load claims experience', 'Refresh funding model', 'Confirm finalist presentation date']
  },
  {
    id: 'quote-lakeview-veterinary-network',
    prospectOrEmployerName: 'Lakeview Veterinary Network',
    marketSegment: 'Small group',
    effectiveDateTarget: '2026-05-01',
    productsRequested: ['Medical'],
    censusStatus: 'Uploaded',
    lastUpdated: '2026-03-17',
    assignedBrokerRep: 'Riley Chen',
    status: 'Draft',
    coverageTiers: ['Employee only', 'Family'],
    proposalSummary: 'Draft quote record opened while current carrier details are still being confirmed.',
    notes: ['Prospect came from referral partner and needs first draft by next week.'],
    nextActions: ['Validate current carrier details', 'Complete draft questionnaire']
  },
  {
    id: 'quote-heritage-milling-co',
    prospectOrEmployerName: 'Heritage Milling Co.',
    marketSegment: 'Large group',
    effectiveDateTarget: '2026-09-01',
    productsRequested: ['Medical', 'Dental', 'Vision'],
    censusStatus: 'Validated',
    lastUpdated: '2026-03-14',
    assignedBrokerRep: 'Morgan Reyes',
    status: 'Sold',
    coverageTiers: ['Employee only', 'Employee + spouse', 'Employee + child', 'Family'],
    proposalSummary: 'Broker won the account with a self-funded PPO strategy and staged implementation timeline.',
    notes: ['Implementation kickoff transitions to service team next week.'],
    nextActions: ['Open implementation case', 'Finalize sold paperwork']
  },
  {
    id: 'quote-redwood-freight-lines',
    prospectOrEmployerName: 'Redwood Freight Lines',
    marketSegment: 'Mid-market',
    effectiveDateTarget: '2026-06-01',
    productsRequested: ['Medical', 'Life'],
    censusStatus: 'Uploaded',
    lastUpdated: '2026-03-11',
    assignedBrokerRep: 'Avery Cole',
    status: 'Closed Lost',
    coverageTiers: ['Employee only', 'Family'],
    proposalSummary: 'Prospect stayed with incumbent due to short-term rate guarantees.',
    notes: ['Keep warm for future renewal season.'],
    nextActions: ['Archive opportunity', 'Schedule next renewal outreach']
  }
];

const brokerRenewals: BrokerRenewal[] = [
  {
    id: 'renewal-blue-harbor-logistics',
    groupId: 'blue-harbor-logistics',
    groupName: 'Blue Harbor Logistics',
    marketSegment: 'Large group',
    renewalDate: '2026-05-01',
    daysUntilRenewal: 43,
    status: 'Decision Pending',
    currentPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'Choice PPO 4500',
      monthlyPremium: 486000,
      fundingType: 'Fully insured'
    },
    proposedPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'Choice PPO 4500',
      monthlyPremium: 523900,
      fundingType: 'Fully insured'
    },
    contributionImpactSummary: {
      employeeOnly: '+$18 PEPM',
      employeeSpouse: '+$31 PEPM',
      family: '+$48 PEPM'
    },
    checklist: [
      { label: 'Rates received', completed: true },
      { label: 'Contribution scenarios prepared', completed: true },
      { label: 'Employer review completed', completed: true },
      { label: 'Signed renewal accepted', completed: false }
    ],
    documentsNeeded: ['Signed renewal acceptance'],
    nextActions: ['Finalize contribution split', 'Collect signed acceptance', 'Release employee communications'],
    rateChangeSummary: {
      currentMonthlyPremium: 486000,
      proposedMonthlyPremium: 523900,
      rateChangePercent: 7.8
    }
  },
  {
    id: 'renewal-riverview-manufacturing',
    groupId: 'riverview-manufacturing',
    groupName: 'Riverview Manufacturing',
    marketSegment: 'Large group',
    renewalDate: '2026-06-01',
    daysUntilRenewal: 74,
    status: 'Awaiting Rates',
    currentPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'Choice PPO 3000',
      monthlyPremium: 742100,
      fundingType: 'Self funded'
    },
    proposedPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'Choice PPO 3000',
      monthlyPremium: 0,
      fundingType: 'Pending'
    },
    contributionImpactSummary: {
      employeeOnly: 'Pending rates',
      employeeSpouse: 'Pending rates',
      family: 'Pending rates'
    },
    checklist: [
      { label: 'Updated census received', completed: false },
      { label: 'Large claimant review submitted', completed: false },
      { label: 'Rates received', completed: false },
      { label: 'Client review scheduled', completed: false }
    ],
    documentsNeeded: ['Updated census', 'Large claimant narrative'],
    nextActions: ['Collect census', 'Submit claimant narrative', 'Escalate rate release if delayed'],
    rateChangeSummary: {
      currentMonthlyPremium: 742100,
      proposedMonthlyPremium: 742100,
      rateChangePercent: 0
    }
  },
  {
    id: 'renewal-riverbend-municipal-services',
    groupId: 'riverbend-municipal-services',
    groupName: 'Riverbend Municipal Services',
    marketSegment: 'Large group',
    renewalDate: '2026-07-01',
    daysUntilRenewal: 104,
    status: 'Employer Review',
    currentPlanSummary: {
      carrier: 'Cobalt Health',
      planName: 'Municipal PPO 2500',
      monthlyPremium: 618400,
      fundingType: 'Fully insured'
    },
    proposedPlanSummary: {
      carrier: 'Cobalt Health',
      planName: 'Municipal PPO 2500',
      monthlyPremium: 651800,
      fundingType: 'Fully insured'
    },
    contributionImpactSummary: {
      employeeOnly: '+$14 PEPM',
      employeeSpouse: '+$27 PEPM',
      family: '+$39 PEPM'
    },
    checklist: [
      { label: 'Rates received', completed: true },
      { label: 'Budget scenarios prepared', completed: true },
      { label: 'Employer review meeting held', completed: true },
      { label: 'Final decision captured', completed: false }
    ],
    documentsNeeded: ['Union contribution language approval'],
    nextActions: ['Collect final board decision', 'Lock contribution language'],
    rateChangeSummary: {
      currentMonthlyPremium: 618400,
      proposedMonthlyPremium: 651800,
      rateChangePercent: 5.4
    }
  },
  {
    id: 'renewal-maple-county-schools',
    groupId: 'maple-county-schools',
    groupName: 'Maple County Schools',
    marketSegment: 'Large group',
    renewalDate: '2026-09-01',
    daysUntilRenewal: 166,
    status: 'In Review',
    currentPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'Education PPO 2000',
      monthlyPremium: 855300,
      fundingType: 'Fully insured'
    },
    proposedPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'Education PPO 2000',
      monthlyPremium: 918400,
      fundingType: 'Fully insured'
    },
    contributionImpactSummary: {
      employeeOnly: '+$22 PEPM',
      employeeSpouse: '+$36 PEPM',
      family: '+$54 PEPM'
    },
    checklist: [
      { label: 'Rates received', completed: true },
      { label: 'Board deck prepared', completed: true },
      { label: 'Board packet approved', completed: false },
      { label: 'Final decision captured', completed: false }
    ],
    documentsNeeded: ['Board packet approval'],
    nextActions: ['Approve board packet', 'Prepare contribution alternatives'],
    rateChangeSummary: {
      currentMonthlyPremium: 855300,
      proposedMonthlyPremium: 918400,
      rateChangePercent: 7.4
    }
  },
  {
    id: 'renewal-prairie-state-grocers',
    groupId: 'prairie-state-grocers',
    groupName: 'Prairie State Grocers',
    marketSegment: 'Mid-market',
    renewalDate: '2026-09-01',
    daysUntilRenewal: 166,
    status: 'Not Started',
    currentPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'Regional HMO 2500',
      monthlyPremium: 341500,
      fundingType: 'Fully insured'
    },
    proposedPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'Regional HMO 2500',
      monthlyPremium: 341500,
      fundingType: 'Pending'
    },
    contributionImpactSummary: {
      employeeOnly: 'Pending rates',
      employeeSpouse: 'Pending rates',
      family: 'Pending rates'
    },
    checklist: [
      { label: 'Dependent audit kickoff roster received', completed: false },
      { label: 'Pre-renewal strategy call held', completed: false },
      { label: 'Rates received', completed: false }
    ],
    documentsNeeded: ['Dependent audit kickoff roster'],
    nextActions: ['Collect audit kickoff roster', 'Schedule pre-renewal planning call'],
    rateChangeSummary: {
      currentMonthlyPremium: 341500,
      proposedMonthlyPremium: 341500,
      rateChangePercent: 0
    }
  },
  {
    id: 'renewal-granite-distribution-holdings',
    groupId: 'granite-distribution-holdings',
    groupName: 'Granite Distribution Holdings',
    marketSegment: 'National account',
    renewalDate: '2026-04-01',
    daysUntilRenewal: 13,
    status: 'Decision Pending',
    currentPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'National PPO 2500',
      monthlyPremium: 1248800,
      fundingType: 'Self funded'
    },
    proposedPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'National PPO 2500',
      monthlyPremium: 1356200,
      fundingType: 'Self funded'
    },
    contributionImpactSummary: {
      employeeOnly: '+$29 PEPM',
      employeeSpouse: '+$44 PEPM',
      family: '+$63 PEPM'
    },
    checklist: [
      { label: 'Rates received', completed: true },
      { label: 'Executive review held', completed: true },
      { label: 'Carrier extension approved', completed: false },
      { label: 'Final decision captured', completed: false }
    ],
    documentsNeeded: ['Signed extension approval', 'Final executive decision memo'],
    nextActions: ['Secure extension approval', 'Capture executive decision', 'Stage implementation if sold'],
    rateChangeSummary: {
      currentMonthlyPremium: 1248800,
      proposedMonthlyPremium: 1356200,
      rateChangePercent: 8.6
    }
  },
  {
    id: 'renewal-horizon-fabrication',
    groupId: 'horizon-fabrication',
    groupName: 'Horizon Fabrication',
    marketSegment: 'Large group',
    renewalDate: '2026-08-01',
    daysUntilRenewal: 135,
    status: 'Accepted',
    currentPlanSummary: {
      carrier: 'Cobalt Health',
      planName: 'PPO 3500',
      monthlyPremium: 598200,
      fundingType: 'Self funded'
    },
    proposedPlanSummary: {
      carrier: 'Cobalt Health',
      planName: 'PPO 3500',
      monthlyPremium: 627500,
      fundingType: 'Self funded'
    },
    contributionImpactSummary: {
      employeeOnly: '+$12 PEPM',
      employeeSpouse: '+$18 PEPM',
      family: '+$26 PEPM'
    },
    checklist: [
      { label: 'Rates received', completed: true },
      { label: 'Client review held', completed: true },
      { label: 'Signed acceptance received', completed: true }
    ],
    documentsNeeded: [],
    nextActions: ['Prepare employee communications', 'Close out renewal checklist'],
    rateChangeSummary: {
      currentMonthlyPremium: 598200,
      proposedMonthlyPremium: 627500,
      rateChangePercent: 4.9
    }
  },
  {
    id: 'renewal-lakeside-union-health',
    groupId: 'lakeside-union-health',
    groupName: 'Lakeside Union Health',
    marketSegment: 'National account',
    renewalDate: '2027-01-01',
    daysUntilRenewal: 288,
    status: 'Not Started',
    currentPlanSummary: {
      carrier: 'Summit National',
      planName: 'National PPO 2000',
      monthlyPremium: 1524000,
      fundingType: 'Self funded'
    },
    proposedPlanSummary: {
      carrier: 'Summit National',
      planName: 'National PPO 2000',
      monthlyPremium: 1524000,
      fundingType: 'Pending'
    },
    contributionImpactSummary: {
      employeeOnly: 'Pending rates',
      employeeSpouse: 'Pending rates',
      family: 'Pending rates'
    },
    checklist: [
      { label: 'Pre-renewal strategy session scheduled', completed: false },
      { label: 'Pharmacy review completed', completed: false }
    ],
    documentsNeeded: ['Q2 governance agenda'],
    nextActions: ['Schedule pre-renewal strategy session', 'Prepare pharmacy review'],
    rateChangeSummary: {
      currentMonthlyPremium: 1524000,
      proposedMonthlyPremium: 1524000,
      rateChangePercent: 0
    }
  },
  {
    id: 'renewal-sterling-pharma-distribution',
    groupId: 'sterling-pharma-distribution',
    groupName: 'Sterling Pharma Distribution',
    marketSegment: 'National account',
    renewalDate: '2026-10-01',
    daysUntilRenewal: 196,
    status: 'In Review',
    currentPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'National PPO 1500',
      monthlyPremium: 1038800,
      fundingType: 'Self funded'
    },
    proposedPlanSummary: {
      carrier: 'Blue Horizon Health',
      planName: 'National PPO 1500',
      monthlyPremium: 1102200,
      fundingType: 'Self funded'
    },
    contributionImpactSummary: {
      employeeOnly: '+$16 PEPM',
      employeeSpouse: '+$24 PEPM',
      family: '+$37 PEPM'
    },
    checklist: [
      { label: 'Clinical review complete', completed: false },
      { label: 'Pharmacy strategy options modeled', completed: true },
      { label: 'Internal broker review held', completed: false }
    ],
    documentsNeeded: ['Clinical management review notes'],
    nextActions: ['Complete clinical review', 'Prepare internal recommendation'],
    rateChangeSummary: {
      currentMonthlyPremium: 1038800,
      proposedMonthlyPremium: 1102200,
      rateChangePercent: 6.1
    }
  },
  {
    id: 'renewal-ironwood-transit-services',
    groupId: 'ironwood-transit-services',
    groupName: 'Ironwood Transit Services',
    marketSegment: 'Large group',
    renewalDate: '2026-11-01',
    daysUntilRenewal: 227,
    status: 'Declined',
    currentPlanSummary: {
      carrier: 'Cobalt Health',
      planName: 'Transit PPO 3000',
      monthlyPremium: 654200,
      fundingType: 'Fully insured'
    },
    proposedPlanSummary: {
      carrier: 'Cobalt Health',
      planName: 'Transit PPO 3000',
      monthlyPremium: 699100,
      fundingType: 'Fully insured'
    },
    contributionImpactSummary: {
      employeeOnly: '+$15 PEPM',
      employeeSpouse: '+$23 PEPM',
      family: '+$35 PEPM'
    },
    checklist: [
      { label: 'Rates received', completed: true },
      { label: 'Employer review complete', completed: true },
      { label: 'Client decision captured', completed: true }
    ],
    documentsNeeded: [],
    nextActions: ['Archive renewal decision', 'Prepare market re-engagement plan'],
    rateChangeSummary: {
      currentMonthlyPremium: 654200,
      proposedMonthlyPremium: 699100,
      rateChangePercent: 6.9
    }
  }
];

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function getRateChangePercent(current: number, proposed: number) {
  if (current === 0) {
    return 0;
  }

  return ((proposed - current) / current) * 100;
}

export function getBrokerQuotes() {
  return brokerQuotes;
}

export function getBrokerQuote(quoteId: string) {
  return brokerQuotes.find((quote) => quote.id === quoteId) ?? null;
}

export function getBrokerRenewals() {
  return brokerRenewals;
}

export function getBrokerRenewal(renewalId: string) {
  return brokerRenewals.find((renewal) => renewal.id === renewalId) ?? null;
}

export function getBrokerQuoteIntakeOptions() {
  const groups = getBrokerPortfolioGroups();
  const prospectNames = brokerQuotes
    .filter((quote) => !quote.groupId)
    .map((quote) => quote.prospectOrEmployerName);

  return {
    existingGroups: groups.map((group) => ({
      id: group.id,
      label: group.groupName,
      segment: group.segment
    })),
    prospectNames,
    products: ['Medical', 'Dental', 'Vision', 'Life', 'Disability'],
    segments: ['Small group', 'Mid-market', 'Large group', 'National account']
  };
}

export function getBrokerRenewalsGroupedByWindow() {
  const groups = {
    '30 days': [] as BrokerRenewal[],
    '60 days': [] as BrokerRenewal[],
    '90 days': [] as BrokerRenewal[],
    '120 days': [] as BrokerRenewal[]
  };

  for (const renewal of brokerRenewals) {
    if (renewal.daysUntilRenewal <= 30) {
      groups['30 days'].push(renewal);
    } else if (renewal.daysUntilRenewal <= 60) {
      groups['60 days'].push(renewal);
    } else if (renewal.daysUntilRenewal <= 90) {
      groups['90 days'].push(renewal);
    } else {
      groups['120 days'].push(renewal);
    }
  }

  return groups;
}

export function getBrokerCommandCenterData() {
  const groups = getBrokerPortfolioGroups();
  const tasks = getBrokerTasks();
  const alerts = getBrokerAlerts();
  const recentActivity = groups
    .flatMap((group) =>
      group.activities.map((activity) => ({
        ...activity,
        groupId: group.id,
        groupName: group.groupName
      }))
    )
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 8);
  const openQuoteCount = brokerQuotes.filter(
    (quote) => quote.status !== 'Sold' && quote.status !== 'Closed Lost'
  ).length;
  const activeRenewalCount = brokerRenewals.filter(
    (renewal) => renewal.status !== 'Accepted' && renewal.status !== 'Declined'
  ).length;

  return {
    tasks,
    alerts,
    kpis: {
      assignedGroups: groups.length,
      renewalsDue: activeRenewalCount,
      openQuotes: openQuoteCount,
      enrollmentsInProgress: groups.filter(
        (group) => group.status === 'Enrollment in progress' || group.status === 'Implementation active'
      ).length,
      pendingTasks: tasks.length,
      mtdCommissions: groups.reduce((sum, group) => sum + group.mtdCommission, 0)
    },
    renewalsNeedingAction: brokerRenewals
      .filter((renewal) => renewal.status !== 'Accepted' && renewal.status !== 'Declined')
      .sort((left, right) => left.daysUntilRenewal - right.daysUntilRenewal)
      .slice(0, 5),
    openQuotes: brokerQuotes
      .filter((quote) => quote.status !== 'Sold' && quote.status !== 'Closed Lost')
      .sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated))
      .slice(0, 5),
    enrollmentIssues: groups
      .filter((group) => group.enrollmentSummary.pendingItems.length > 0)
      .sort(
        (left, right) =>
          right.enrollmentSummary.pendingItems.length - left.enrollmentSummary.pendingItems.length
      )
      .slice(0, 5),
    recentActivity,
    commissionSnapshot: {
      mtdCommissions: groups.reduce((sum, group) => sum + group.mtdCommission, 0),
      postedGroups: groups.filter((group) => group.commissionStatus === 'Posted').length,
      exceptions: groups.filter((group) => group.commissionStatus !== 'Posted').length,
      pendingValue: groups
        .filter((group) => group.commissionStatus !== 'Posted')
        .reduce((sum, group) => sum + group.mtdCommission, 0)
    }
  };
}

export function getBrokerRenewalGroupContext(renewal: BrokerRenewal) {
  return getBrokerPortfolioGroup(renewal.groupId);
}

export function getBrokerQuoteGroupContext(quote: BrokerQuote) {
  return quote.groupId ? getBrokerPortfolioGroup(quote.groupId) : null;
}

export function createMockQuoteSummary(input: {
  selectedGroupId: string;
  prospectName: string;
  marketSegment: string;
  productsRequested: string[];
  effectiveDateTarget: string;
  censusStatus: 'Pending' | 'Uploaded';
  assignedBrokerRep: string;
}) {
  const group = input.selectedGroupId ? getBrokerPortfolioGroup(input.selectedGroupId) : null;
  const prospectOrEmployerName = group?.groupName ?? input.prospectName;
  const currentDate = '2026-03-19';

  return {
    id: `draft-${prospectOrEmployerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    prospectOrEmployerName,
    marketSegment: input.marketSegment,
    effectiveDateTarget: input.effectiveDateTarget,
    productsRequested: input.productsRequested,
    censusStatus: input.censusStatus,
    lastUpdated: currentDate,
    assignedBrokerRep: input.assignedBrokerRep,
    status: input.censusStatus === 'Pending' ? 'Census Needed' : 'Draft',
    proposalSummary: 'Draft quote intake captured and ready for broker review or market release.',
    nextActions:
      input.censusStatus === 'Pending'
        ? ['Collect census', 'Confirm current plan details', 'Release to market when complete']
        : ['Review intake summary', 'Prepare market release', 'Assign quote owner']
  };
}
