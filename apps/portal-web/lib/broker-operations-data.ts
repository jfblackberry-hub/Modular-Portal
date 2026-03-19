import { getBrokerPortfolioGroups } from './broker-portfolio-data';
import { getBrokerQuotes, getBrokerRenewals } from './broker-sales-workspace-data';

export type BrokerCommissionRecord = {
  id: string;
  month: string;
  quarter: string;
  year: number;
  groupId: string;
  groupName: string;
  productLine: 'Medical' | 'Dental' | 'Vision' | 'Life' | 'Ancillary';
  amount: number;
  status: 'Paid' | 'Pending';
  statementTitle: string;
  hasException: boolean;
  exceptionReason?: string;
};

export type BrokerDocumentRecord = {
  id: string;
  title: string;
  category:
    | 'Census Files'
    | 'Quote Proposals'
    | 'Renewal Packets'
    | 'Employer Documents'
    | 'Commission Statements'
    | 'Plan Documents';
  groupId?: string;
  groupName?: string;
  status: 'Uploaded' | 'Pending Review' | 'Needs Attention' | 'Complete';
  uploadedBy: string;
  updatedAt: string;
  description: string;
};

export type BrokerCaseRecord = {
  id: string;
  title: string;
  status: 'Open' | 'Waiting on Employer' | 'Waiting on Carrier' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  owner: string;
  groupId?: string;
  groupName?: string;
  quoteId?: string;
  renewalId?: string;
  summary: string;
  nextStep: string;
};

const brokerCommissionRecords: BrokerCommissionRecord[] = [
  {
    id: 'comm-1',
    month: 'March',
    quarter: 'Q1',
    year: 2026,
    groupId: 'blue-harbor-logistics',
    groupName: 'Blue Harbor Logistics',
    productLine: 'Medical',
    amount: 6120,
    status: 'Paid',
    statementTitle: 'March medical statement',
    hasException: false
  },
  {
    id: 'comm-2',
    month: 'March',
    quarter: 'Q1',
    year: 2026,
    groupId: 'blue-harbor-logistics',
    groupName: 'Blue Harbor Logistics',
    productLine: 'Dental',
    amount: 2300,
    status: 'Paid',
    statementTitle: 'March dental statement',
    hasException: false
  },
  {
    id: 'comm-3',
    month: 'March',
    quarter: 'Q1',
    year: 2026,
    groupId: 'riverview-manufacturing',
    groupName: 'Riverview Manufacturing',
    productLine: 'Medical',
    amount: 12110,
    status: 'Pending',
    statementTitle: 'March self-funded statement',
    hasException: true,
    exceptionReason: 'Broker of record split mismatch'
  },
  {
    id: 'comm-4',
    month: 'March',
    quarter: 'Q1',
    year: 2026,
    groupId: 'maple-county-schools',
    groupName: 'Maple County Schools',
    productLine: 'Medical',
    amount: 14420,
    status: 'Pending',
    statementTitle: 'March education statement',
    hasException: true,
    exceptionReason: 'Renewal adjustment still pending'
  },
  {
    id: 'comm-5',
    month: 'March',
    quarter: 'Q1',
    year: 2026,
    groupId: 'lakeside-union-health',
    groupName: 'Lakeside Union Health',
    productLine: 'Medical',
    amount: 16540,
    status: 'Paid',
    statementTitle: 'March national account statement',
    hasException: false
  },
  {
    id: 'comm-6',
    month: 'March',
    quarter: 'Q1',
    year: 2026,
    groupId: 'lakeside-union-health',
    groupName: 'Lakeside Union Health',
    productLine: 'Dental',
    amount: 5610,
    status: 'Paid',
    statementTitle: 'March ancillary statement',
    hasException: false
  },
  {
    id: 'comm-7',
    month: 'February',
    quarter: 'Q1',
    year: 2026,
    groupId: 'north-coast-retail',
    groupName: 'North Coast Retail',
    productLine: 'Medical',
    amount: 3180,
    status: 'Pending',
    statementTitle: 'February implementation statement',
    hasException: true,
    exceptionReason: 'Implementation effective date adjustment'
  },
  {
    id: 'comm-8',
    month: 'March',
    quarter: 'Q1',
    year: 2026,
    groupId: 'harborview-hospitality-group',
    groupName: 'Harborview Hospitality Group',
    productLine: 'Medical',
    amount: 4725,
    status: 'Paid',
    statementTitle: 'March hospitality statement',
    hasException: false
  },
  {
    id: 'comm-9',
    month: 'March',
    quarter: 'Q1',
    year: 2026,
    groupId: 'sterling-pharma-distribution',
    groupName: 'Sterling Pharma Distribution',
    productLine: 'Medical',
    amount: 15140,
    status: 'Paid',
    statementTitle: 'March pharma statement',
    hasException: false
  },
  {
    id: 'comm-10',
    month: 'March',
    quarter: 'Q1',
    year: 2026,
    groupId: 'sterling-pharma-distribution',
    groupName: 'Sterling Pharma Distribution',
    productLine: 'Vision',
    amount: 3220,
    status: 'Paid',
    statementTitle: 'March ancillary statement',
    hasException: false
  }
];

const brokerDocuments: BrokerDocumentRecord[] = [
  {
    id: 'doc-1',
    title: 'Blue Harbor 2026 Renewal Exhibit',
    category: 'Renewal Packets',
    groupId: 'blue-harbor-logistics',
    groupName: 'Blue Harbor Logistics',
    status: 'Complete',
    uploadedBy: 'Jordan Patel',
    updatedAt: '2026-03-18',
    description: 'Final renewal exhibit with contribution scenarios and rate summaries.'
  },
  {
    id: 'doc-2',
    title: 'Riverview Updated Census',
    category: 'Census Files',
    groupId: 'riverview-manufacturing',
    groupName: 'Riverview Manufacturing',
    status: 'Needs Attention',
    uploadedBy: 'Employer HR',
    updatedAt: '2026-03-17',
    description: 'Census file uploaded with validation gaps that still need broker review.'
  },
  {
    id: 'doc-3',
    title: 'Oak Valley Quote Proposal Draft',
    category: 'Quote Proposals',
    groupId: 'oak-valley-pediatrics',
    groupName: 'Oak Valley Pediatrics',
    status: 'Pending Review',
    uploadedBy: 'Riley Chen',
    updatedAt: '2026-03-18',
    description: 'Draft proposal deck pending final census and pricing validation.'
  },
  {
    id: 'doc-4',
    title: 'North Coast Signed Application',
    category: 'Employer Documents',
    groupId: 'north-coast-retail',
    groupName: 'North Coast Retail',
    status: 'Complete',
    uploadedBy: 'Taylor Brooks',
    updatedAt: '2026-03-16',
    description: 'Signed enrollment application tied to the implementation file.'
  },
  {
    id: 'doc-5',
    title: 'March Commission Statement',
    category: 'Commission Statements',
    groupId: 'maple-county-schools',
    groupName: 'Maple County Schools',
    status: 'Pending Review',
    uploadedBy: 'Carrier Finance',
    updatedAt: '2026-03-19',
    description: 'Commission statement pending reconciliation for renewal adjustments.'
  },
  {
    id: 'doc-6',
    title: 'Choice PPO 4500 Plan Summary',
    category: 'Plan Documents',
    groupId: 'blue-harbor-logistics',
    groupName: 'Blue Harbor Logistics',
    status: 'Complete',
    uploadedBy: 'Carrier team',
    updatedAt: '2026-03-12',
    description: 'Current plan summary with benefits and coverage tiers.'
  },
  {
    id: 'doc-7',
    title: 'Granite Executive Recommendation',
    category: 'Renewal Packets',
    groupId: 'granite-distribution-holdings',
    groupName: 'Granite Distribution Holdings',
    status: 'Needs Attention',
    uploadedBy: 'Morgan Reyes',
    updatedAt: '2026-03-19',
    description: 'Executive renewal recommendation awaiting final decision memo.'
  },
  {
    id: 'doc-8',
    title: 'Coastal Tech Census',
    category: 'Census Files',
    groupId: 'coastal-tech-solutions',
    groupName: 'Coastal Tech Solutions',
    status: 'Complete',
    uploadedBy: 'Casey Nguyen',
    updatedAt: '2026-03-19',
    description: 'Validated census used for current quote comparison.'
  }
];

const quotes = getBrokerQuotes();
const renewals = getBrokerRenewals();
const groups = getBrokerPortfolioGroups();

const brokerCases: BrokerCaseRecord[] = [
  {
    id: 'case-1',
    title: 'Riverview census issue escalation',
    status: 'Open',
    priority: 'High',
    dueDate: '2026-03-22',
    owner: 'Morgan Reyes',
    groupId: 'riverview-manufacturing',
    groupName: 'Riverview Manufacturing',
    renewalId: 'renewal-riverview-manufacturing',
    summary: 'Updated census and claimant narrative are still missing, blocking rate release.',
    nextStep: 'Escalate to employer CFO and confirm document delivery plan.'
  },
  {
    id: 'case-2',
    title: 'Oak Valley census follow-up',
    status: 'Waiting on Employer',
    priority: 'Medium',
    dueDate: '2026-03-25',
    owner: 'Riley Chen',
    groupId: 'oak-valley-pediatrics',
    groupName: 'Oak Valley Pediatrics',
    quoteId: 'quote-oak-valley-pediatrics',
    summary: 'Final employee count is still pending for the level-funded quote release.',
    nextStep: 'Follow up with the practice manager on final headcount.'
  },
  {
    id: 'case-3',
    title: 'North Coast file correction',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2026-03-23',
    owner: 'Taylor Brooks',
    groupId: 'north-coast-retail',
    groupName: 'North Coast Retail',
    summary: 'Dependent verification and payroll mapping issues are delaying enrollment file release.',
    nextStep: 'Correct payroll mapping and resubmit validation file.'
  },
  {
    id: 'case-4',
    title: 'Maple County commission adjustment review',
    status: 'Waiting on Carrier',
    priority: 'Medium',
    dueDate: '2026-03-28',
    owner: 'Avery Cole',
    groupId: 'maple-county-schools',
    groupName: 'Maple County Schools',
    summary: 'March commission statement reflects pending renewal adjustment.',
    nextStep: 'Confirm adjustment timeline with carrier finance.'
  },
  {
    id: 'case-5',
    title: 'Granite executive renewal decision',
    status: 'Open',
    priority: 'High',
    dueDate: '2026-03-22',
    owner: 'Morgan Reyes',
    groupId: 'granite-distribution-holdings',
    groupName: 'Granite Distribution Holdings',
    renewalId: 'renewal-granite-distribution-holdings',
    summary: 'Renewal decision remains open and carrier extension expires this week.',
    nextStep: 'Capture final executive decision and secure extension approval.'
  },
  {
    id: 'case-6',
    title: 'Blue Harbor signed renewal acceptance',
    status: 'Waiting on Employer',
    priority: 'Medium',
    dueDate: '2026-03-29',
    owner: 'Jordan Patel',
    groupId: 'blue-harbor-logistics',
    groupName: 'Blue Harbor Logistics',
    renewalId: 'renewal-blue-harbor-logistics',
    summary: 'Contribution review is complete but signed acceptance has not been returned.',
    nextStep: 'Collect signed acceptance and finalize employee communication timing.'
  },
  {
    id: 'case-7',
    title: 'Greenfield proposal presentation scheduling',
    status: 'In Progress',
    priority: 'Low',
    dueDate: '2026-03-24',
    owner: 'Casey Nguyen',
    groupId: 'greenfield-dental-associates',
    groupName: 'Greenfield Dental Associates',
    quoteId: 'quote-greenfield-dental-associates',
    summary: 'Proposal is ready and the broker needs to align on presentation timing.',
    nextStep: 'Book client presentation and confirm decision timeline.'
  },
  {
    id: 'case-8',
    title: 'Pinecrest EOI file request',
    status: 'Resolved',
    priority: 'Medium',
    dueDate: '2026-03-18',
    owner: 'Taylor Brooks',
    groupId: 'pinecrest-senior-living',
    groupName: 'Pinecrest Senior Living',
    summary: 'Voluntary life EOI file has been delivered to the ancillary carrier.',
    nextStep: 'Monitor carrier setup confirmation.'
  }
];

export function getBrokerCommissionRecords() {
  return brokerCommissionRecords;
}

export function getBrokerDocuments() {
  return brokerDocuments;
}

export function getBrokerCases() {
  return brokerCases;
}

export function getBrokerCommissionsSummary() {
  const total = brokerCommissionRecords.reduce((sum, record) => sum + record.amount, 0);
  const paid = brokerCommissionRecords
    .filter((record) => record.status === 'Paid')
    .reduce((sum, record) => sum + record.amount, 0);
  const pending = brokerCommissionRecords
    .filter((record) => record.status === 'Pending')
    .reduce((sum, record) => sum + record.amount, 0);
  const exceptions = brokerCommissionRecords.filter((record) => record.hasException);

  return {
    total,
    paid,
    pending,
    exceptions,
    byProductLine: Array.from(
      brokerCommissionRecords.reduce((map, record) => {
        map.set(record.productLine, (map.get(record.productLine) ?? 0) + record.amount);
        return map;
      }, new Map<string, number>())
    ).map(([productLine, amount]) => ({ productLine, amount })),
    byGroup: groups
      .map((group) => ({
        groupId: group.id,
        groupName: group.groupName,
        amount: brokerCommissionRecords
          .filter((record) => record.groupId === group.id)
          .reduce((sum, record) => sum + record.amount, 0)
      }))
      .filter((item) => item.amount > 0)
      .sort((left, right) => right.amount - left.amount)
  };
}

export function getBrokerDocumentFilterOptions() {
  return {
    categories: Array.from(new Set(brokerDocuments.map((document) => document.category))).sort(),
    statuses: Array.from(new Set(brokerDocuments.map((document) => document.status))).sort()
  };
}

export function getBrokerCasesFilterOptions() {
  return {
    statuses: ['Open', 'Waiting on Employer', 'Waiting on Carrier', 'In Progress', 'Resolved'],
    priorities: ['High', 'Medium', 'Low'],
    owners: Array.from(new Set(brokerCases.map((item) => item.owner))).sort()
  };
}

export function getBrokerSupportResources() {
  return [
    {
      id: 'support-1',
      title: 'Broker renewal timeline guide',
      description: 'Quarter-by-quarter renewal sequencing, carrier milestones, and handoff expectations.',
      href: '/broker/renewals'
    },
    {
      id: 'support-2',
      title: 'Quote intake checklist',
      description: 'Broker-ready intake items covering census, current plans, effective dates, and requested products.',
      href: '/broker/quotes/new'
    },
    {
      id: 'support-3',
      title: 'Commission statement review tips',
      description: 'Reference guidance for spotting split discrepancies and pending carrier adjustments.',
      href: '/broker/commissions'
    }
  ];
}

export function getBrokerCrossModuleCounts() {
  return {
    quotes: quotes.filter((quote) => !['Sold', 'Closed Lost'].includes(quote.status)).length,
    renewals: renewals.filter((renewal) => !['Accepted', 'Declined'].includes(renewal.status)).length,
    tasks: brokerCases.filter((item) => item.status !== 'Resolved').length,
    documentsNeedingAttention: brokerDocuments.filter((item) => item.status !== 'Complete').length
  };
}
