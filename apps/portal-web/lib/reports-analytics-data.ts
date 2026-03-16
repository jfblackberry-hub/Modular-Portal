export type ReportCategory =
  | 'Employee Reports'
  | 'Coverage Reports'
  | 'Billing Reports'
  | 'Compliance Reports';

export type ReportFormat = 'csv' | 'excel' | 'pdf';

export type ReportId =
  | 'employee-census'
  | 'enrollment-status'
  | 'waived-employees'
  | 'terminated-employees'
  | 'plan-enrollment-distribution'
  | 'coverage-tier-distribution'
  | 'dependent-coverage-summary'
  | 'billing-summary'
  | 'invoice-history'
  | 'payment-reconciliation'
  | 'eligibility-audit'
  | 'coverage-verification'
  | 'enrollment-change-log';

export type ReportDefinition = {
  id: ReportId;
  name: string;
  category: ReportCategory;
  description: string;
};

export type ReportFilters = {
  dateRange: 'Last 30 Days' | 'Last 90 Days' | 'Year to Date' | 'Custom';
  planType: 'All' | 'Gold PPO' | 'Silver HMO' | 'Bronze HDHP';
  coverageTier: 'All' | 'Employee Only' | 'Employee + Spouse' | 'Employee + Children' | 'Family';
  employeeStatus: 'All' | 'Active' | 'Terminated' | 'Waived';
  department: 'All' | 'Finance' | 'Engineering' | 'People Operations' | 'Sales' | 'Operations';
  enrollmentStatus: 'All' | 'Pending' | 'Completed' | 'Needs Correction' | 'Error';
};

export type ReportResult = {
  headers: string[];
  rows: string[][];
};

export type AnalyticsMetric = {
  label: string;
  value: number;
  change: string;
};

export type AnalyticsSeriesPoint = {
  label: string;
  value: number;
};

export type AnalyticsDataset = {
  summaryMetrics: AnalyticsMetric[];
  coverageDistribution: AnalyticsSeriesPoint[];
  planEnrollmentBreakdown: AnalyticsSeriesPoint[];
  dependentCoverageRatios: AnalyticsSeriesPoint[];
  enrollmentTrends: AnalyticsSeriesPoint[];
  billingTrends: AnalyticsSeriesPoint[];
};

export type ScheduledReportRecord = {
  id: string;
  reportId: ReportId;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  delivery: 'Email Delivery' | 'Downloadable Archive';
  presetName: string;
  nextRunDate: string;
  active: boolean;
};

export const reportDefinitions: ReportDefinition[] = [
  { id: 'employee-census', name: 'Employee Census', category: 'Employee Reports', description: 'Roster and eligibility footprint for all employees.' },
  { id: 'enrollment-status', name: 'Enrollment Status', category: 'Employee Reports', description: 'Pending, completed, and exception enrollment states.' },
  { id: 'waived-employees', name: 'Waived Employees', category: 'Employee Reports', description: 'Employees currently waived from plan coverage.' },
  { id: 'terminated-employees', name: 'Terminated Employees', category: 'Employee Reports', description: 'Terminated workers and coverage termination dates.' },
  { id: 'plan-enrollment-distribution', name: 'Plan Enrollment Distribution', category: 'Coverage Reports', description: 'Enrollment count split by plan option.' },
  { id: 'coverage-tier-distribution', name: 'Coverage Tier Distribution', category: 'Coverage Reports', description: 'Employee-only and family-tier mix.' },
  { id: 'dependent-coverage-summary', name: 'Dependent Coverage Summary', category: 'Coverage Reports', description: 'Dependent counts and covered-life profile.' },
  { id: 'billing-summary', name: 'Billing Summary', category: 'Billing Reports', description: 'Current cycle billing totals and deltas.' },
  { id: 'invoice-history', name: 'Invoice History', category: 'Billing Reports', description: 'Invoice trend, status, and amount history.' },
  { id: 'payment-reconciliation', name: 'Payment Reconciliation', category: 'Billing Reports', description: 'Payment postings, retries, and exceptions.' },
  { id: 'eligibility-audit', name: 'Eligibility Audit', category: 'Compliance Reports', description: 'Eligibility verification anomalies and exceptions.' },
  { id: 'coverage-verification', name: 'Coverage Verification', category: 'Compliance Reports', description: 'Coverage verification checkpoints and attestations.' },
  { id: 'enrollment-change-log', name: 'Enrollment Change Log', category: 'Compliance Reports', description: 'Audit-ready enrollment activity ledger.' }
];

function tenantOffset(tenantId: string) {
  return tenantId.length % 5;
}

export function getAnalyticsDatasetForTenant(tenantId: string): AnalyticsDataset {
  const offset = tenantOffset(tenantId);

  return {
    summaryMetrics: [
      { label: 'Covered Lives', value: 1035 + offset * 4, change: '+2.4%' },
      { label: 'Enrollment Completion', value: 83 + offset, change: '+1.2%' },
      { label: 'Monthly Billing Total', value: 214832 + offset * 900, change: '+0.6%' },
      { label: 'Avg Dependents / Employee', value: 1.4 + offset * 0.05, change: '-0.1%' }
    ],
    coverageDistribution: [
      { label: 'Employee Only', value: 152 + offset },
      { label: 'Employee + Spouse', value: 118 + offset },
      { label: 'Employee + Children', value: 89 + offset },
      { label: 'Family', value: 64 + offset }
    ],
    planEnrollmentBreakdown: [
      { label: 'Gold PPO', value: 178 + offset },
      { label: 'Silver HMO', value: 161 + offset },
      { label: 'Bronze HDHP', value: 84 + offset }
    ],
    dependentCoverageRatios: [
      { label: 'No Dependents', value: 176 + offset },
      { label: '1 Dependent', value: 132 + offset },
      { label: '2+ Dependents', value: 115 + offset }
    ],
    enrollmentTrends: [
      { label: 'Oct', value: 18 + offset },
      { label: 'Nov', value: 24 + offset },
      { label: 'Dec', value: 28 + offset },
      { label: 'Jan', value: 33 + offset },
      { label: 'Feb', value: 29 + offset },
      { label: 'Mar', value: 31 + offset }
    ],
    billingTrends: [
      { label: 'Oct', value: 198400 + offset * 700 },
      { label: 'Nov', value: 201250 + offset * 700 },
      { label: 'Dec', value: 205904 + offset * 700 },
      { label: 'Jan', value: 206740 + offset * 700 },
      { label: 'Feb', value: 208910 + offset * 700 },
      { label: 'Mar', value: 214832 + offset * 700 }
    ]
  };
}

export function getScheduledReportsForTenant(tenantId: string): ScheduledReportRecord[] {
  return [
    {
      id: `${tenantId}-sched-1`,
      reportId: 'employee-census',
      frequency: 'Weekly',
      delivery: 'Email Delivery',
      presetName: 'Weekly Workforce Snapshot',
      nextRunDate: '2026-03-23',
      active: true
    },
    {
      id: `${tenantId}-sched-2`,
      reportId: 'billing-summary',
      frequency: 'Monthly',
      delivery: 'Downloadable Archive',
      presetName: 'Finance Close Package',
      nextRunDate: '2026-04-01',
      active: true
    }
  ];
}

function sampleRowsForReport(id: ReportId, tenantId: string): string[][] {
  const tag = tenantId.slice(0, 4).toUpperCase();

  switch (id) {
    case 'employee-census':
      return [
        [`E-1001-${tag}`, 'Olivia Carter', 'Active', 'Gold PPO', 'Family', 'Finance'],
        [`E-1002-${tag}`, 'Daniel Nguyen', 'Active', 'Silver HMO', 'Employee + Children', 'Engineering'],
        [`E-1004-${tag}`, 'Marcus Reed', 'Waived', 'Waived', 'Waived', 'Sales']
      ];
    case 'invoice-history':
      return [
        [`INV-2026-03-${tag}`, 'Mar 2026', '214832', 'Pending', '2026-03-30'],
        [`INV-2026-02-${tag}`, 'Feb 2026', '208910', 'Paid', '2026-02-28'],
        [`INV-2026-01-${tag}`, 'Jan 2026', '206740', 'Paid', '2026-01-30']
      ];
    case 'billing-summary':
      return [
        ['Mar 2026', '214832', '5922', 'Pending Payment'],
        ['Feb 2026', '208910', '0', 'Paid in Full']
      ];
    case 'enrollment-change-log':
      return [
        ['2026-03-12', 'E-1003', 'New Hire Enrollment', 'Pending'],
        ['2026-03-11', 'E-1001', 'Open Enrollment Change', 'In Progress'],
        ['2026-03-10', 'E-1004', 'Coverage Termination', 'Pending']
      ];
    default:
      return [
        ['Sample', 'Tenant Scoped', 'Data'],
        ['Report', id, tenantId]
      ];
  }
}

function headersForReport(id: ReportId): string[] {
  switch (id) {
    case 'employee-census':
      return ['Employee ID', 'Employee Name', 'Status', 'Plan', 'Coverage Tier', 'Department'];
    case 'invoice-history':
      return ['Invoice Number', 'Billing Period', 'Amount', 'Status', 'Due Date'];
    case 'billing-summary':
      return ['Period', 'Invoice Total', 'Outstanding Balance', 'Billing Status'];
    case 'enrollment-change-log':
      return ['Date', 'Employee ID', 'Request Type', 'Status'];
    default:
      return ['Column A', 'Column B', 'Column C'];
  }
}

export function runReportForTenant(
  tenantId: string,
  reportId: ReportId,
  _filters: ReportFilters
): ReportResult {
  return {
    headers: headersForReport(reportId),
    rows: sampleRowsForReport(reportId, tenantId)
  };
}

export function reportResultToCsv(result: ReportResult) {
  const rows = [result.headers, ...result.rows];
  return rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export function reportResultToExcelCsv(result: ReportResult) {
  return `sep=,\n${reportResultToCsv(result)}`;
}

export function reportResultToPdfText(
  reportName: string,
  result: ReportResult,
  tenantName: string
) {
  return [
    `Report: ${reportName}`,
    `Tenant: ${tenantName}`,
    '',
    result.headers.join(' | '),
    ...result.rows.map((row) => row.join(' | '))
  ].join('\n');
}

export function groupReportsByCategory() {
  return reportDefinitions.reduce<Record<ReportCategory, ReportDefinition[]>>(
    (acc, report) => {
      if (!acc[report.category]) {
        acc[report.category] = [];
      }
      acc[report.category].push(report);
      return acc;
    },
    {
      'Employee Reports': [],
      'Coverage Reports': [],
      'Billing Reports': [],
      'Compliance Reports': []
    }
  );
}

export function defaultReportFilters(): ReportFilters {
  return {
    dateRange: 'Last 30 Days',
    planType: 'All',
    coverageTier: 'All',
    employeeStatus: 'All',
    department: 'All',
    enrollmentStatus: 'All'
  };
}
