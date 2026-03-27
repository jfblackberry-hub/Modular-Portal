export type ProviderReportId =
  | 'patient-census'
  | 'sessions-delivered'
  | 'authorization-utilization'
  | 'eligibility-readiness'
  | 'claims-revenue'
  | 'denials-resubmissions'
  | 'therapist-utilization'
  | 'supervisory-oversight'
  | 'location-performance'
  | 'executive-business-summary';

export type ProviderReportDateRange =
  | 'last_30_days'
  | 'last_90_days'
  | 'last_180_days'
  | 'year_to_date'
  | 'last_12_months'
  | 'last_24_months';

export type ProviderReportTone = 'critical' | 'info' | 'success' | 'warning';

export interface ProviderReportingFilters {
  authorizationStatus: string;
  claimStatus: string;
  dateRange: ProviderReportDateRange;
  denialReason: string;
  location: string;
  patientType: string;
  payer: string;
  reportId: ProviderReportId;
  serviceSetting: string;
  status: string;
  supervisingClinician: string;
  therapist: string;
}

export interface ProviderReportLibraryEntry {
  description: string;
  id: ProviderReportId;
  label: string;
}

export interface ProviderReportFilterOption {
  label: string;
  value: string;
}

export interface ProviderReportMetric {
  changeLabel: string;
  label: string;
  tone: ProviderReportTone;
  value: string;
}

export interface ProviderReportChartDatum {
  detail?: string;
  label: string;
  secondaryValue?: number;
  tone: ProviderReportTone;
  value: number;
}

export interface ProviderReportChart {
  format: 'count' | 'currency' | 'percent';
  id: string;
  subtitle: string;
  title: string;
  type: 'comparison' | 'distribution' | 'trend';
  data: ProviderReportChartDatum[];
}

export interface ProviderReportTableColumn {
  align?: 'left' | 'right';
  key: string;
  label: string;
}

export interface ProviderReportTableRow {
  id: string;
  values: Record<string, string>;
}

export interface ProviderReportTable {
  columns: ProviderReportTableColumn[];
  description: string;
  rows: ProviderReportTableRow[];
  title: string;
}

export interface ProviderReportView {
  appliedFiltersLabel: string;
  charts: ProviderReportChart[];
  dataFreshnessLabel: string;
  description: string;
  lastRunLabel: string;
  metrics: ProviderReportMetric[];
  notes: string[];
  recordCount: number;
  reportId: ProviderReportId;
  reportLabel: string;
  table: ProviderReportTable;
}

export interface ProviderReportingSummary {
  approximateRecordCounts: {
    authorizations: number;
    claims: number;
    eligibilityChecks: number;
    locations: number;
    patients: number;
    sessions: number;
    staff: number;
  };
  generatedThrough: string;
  lookbackMonths: number;
}

export interface ProviderReportingStaticOptions {
  authorizationStatuses: ProviderReportFilterOption[];
  claimStatuses: ProviderReportFilterOption[];
  dateRanges: ProviderReportFilterOption[];
  denialReasons: ProviderReportFilterOption[];
  library: ProviderReportLibraryEntry[];
  locations: ProviderReportFilterOption[];
  patientTypes: ProviderReportFilterOption[];
  payers: ProviderReportFilterOption[];
  serviceSettings: ProviderReportFilterOption[];
  statuses: ProviderReportFilterOption[];
  supervisingClinicians: ProviderReportFilterOption[];
  therapists: ProviderReportFilterOption[];
}

export interface ProviderReportingPayload {
  options: ProviderReportingStaticOptions;
  report: ProviderReportView;
  summary: ProviderReportingSummary;
}

function option(label: string, value = label.toLowerCase().replaceAll(/\s+/g, '_')): ProviderReportFilterOption {
  return { label, value };
}

export const PROVIDER_REPORT_LIBRARY: ProviderReportLibraryEntry[] = [
  {
    id: 'patient-census',
    label: 'Patient Census Report',
    description: 'Understand active census, new starts, discharges, and patient mix by location.'
  },
  {
    id: 'sessions-delivered',
    label: 'Sessions Delivered Report',
    description: 'Track scheduled, completed, canceled, and no-show sessions with trend visibility.'
  },
  {
    id: 'authorization-utilization',
    label: 'Authorization Utilization Report',
    description: 'See authorization depletion risk, low remaining visits, and expiring authorizations.'
  },
  {
    id: 'eligibility-readiness',
    label: 'Eligibility and Readiness Report',
    description: 'Review verification performance and visit readiness blockers before families arrive.'
  },
  {
    id: 'claims-revenue',
    label: 'Claims and Revenue Report',
    description: 'Understand claims flow, billed dollars, paid dollars, and revenue at risk.'
  },
  {
    id: 'denials-resubmissions',
    label: 'Denials and Resubmissions Report',
    description: 'Isolate denial reasons, payer patterns, resubmission success, and open backlog.'
  },
  {
    id: 'therapist-utilization',
    label: 'Therapist Utilization Report',
    description: 'Compare therapist load, capacity, and utilization health across the clinic organization.'
  },
  {
    id: 'supervisory-oversight',
    label: 'Supervisory Oversight Report',
    description: 'Track supervision coverage, missing oversight, and supervising clinician gaps.'
  },
  {
    id: 'location-performance',
    label: 'Location Performance Summary',
    description: 'Compare census, delivery, denial rate, revenue, and authorization risk by location.'
  },
  {
    id: 'executive-business-summary',
    label: 'Executive Business Summary',
    description: 'Top-line business view for centralized administration with operational and financial rollups.'
  }
];

export const PROVIDER_REPORT_DATE_RANGES: ProviderReportFilterOption[] = [
  option('Last 30 days', 'last_30_days'),
  option('Last 90 days', 'last_90_days'),
  option('Last 180 days', 'last_180_days'),
  option('Year to date', 'year_to_date'),
  option('Last 12 months', 'last_12_months'),
  option('Last 24 months', 'last_24_months')
];

export function createDefaultProviderReportingFilters(): ProviderReportingFilters {
  return {
    reportId: 'executive-business-summary',
    dateRange: 'last_12_months',
    patientType: 'all',
    location: 'all',
    payer: 'all',
    therapist: 'all',
    supervisingClinician: 'all',
    status: 'all',
    authorizationStatus: 'all',
    claimStatus: 'all',
    denialReason: 'all',
    serviceSetting: 'all'
  };
}

export function buildProviderReportingStaticOptions(
  overrides: Partial<ProviderReportingStaticOptions> = {}
): ProviderReportingStaticOptions {
  return {
    library: PROVIDER_REPORT_LIBRARY,
    dateRanges: PROVIDER_REPORT_DATE_RANGES,
    patientTypes: [option('All', 'all')],
    locations: [option('All', 'all')],
    payers: [option('All', 'all')],
    therapists: [option('All', 'all')],
    supervisingClinicians: [option('All', 'all')],
    statuses: [option('All', 'all')],
    authorizationStatuses: [option('All', 'all')],
    claimStatuses: [option('All', 'all')],
    denialReasons: [option('All', 'all')],
    serviceSettings: [option('All', 'all')],
    ...overrides
  };
}

export function formatProviderReportFilterLabel(value: string) {
  if (value === 'all') {
    return 'All';
  }

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
