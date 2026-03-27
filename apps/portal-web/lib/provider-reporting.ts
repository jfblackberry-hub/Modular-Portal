export type ProviderReportId =
  | 'operational-performance'
  | 'authorization-outlook'
  | 'denial-recovery'
  | 'capacity-and-access';

export type ProviderReportDateRange = 'last_30_days' | 'last_60_days' | 'quarter_to_date';

export interface ProviderReportingFilters {
  clinician: string;
  dateRange: ProviderReportDateRange;
  location: string;
  patientType: string;
  payer: string;
  reportId: ProviderReportId;
}

interface HistoricalOperationalRecord {
  weekStart: string;
  location: string;
  patientType: string;
  payer: string;
  therapist: string;
  supervisingClinician: string;
  scheduledSessions: number;
  completedSessions: number;
  openCoverageGaps: number;
  atRiskSessions: number;
  expiringAuths: number;
  expiredButScheduled: number;
  lowRemainingVisits: number;
  pendingAuthFollowUp: number;
  claimsSubmitted: number;
  claimsDenied: number;
  pendingResubmissions: number;
  recoveredClaims: number;
  revenuePosted: number;
  revenueAtRisk: number;
  utilizationPercent: number;
  openCapacitySlots: number;
}

export interface ProviderReportOption {
  description: string;
  id: ProviderReportId;
  label: string;
}

export interface ProviderReportMetric {
  changeLabel: string;
  label: string;
  tone: 'critical' | 'info' | 'success' | 'warning';
  value: string;
}

export interface ProviderReportChartPoint {
  label: string;
  tone: 'critical' | 'info' | 'success' | 'warning';
  value: number;
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

export interface ProviderReportView {
  chartCaption: string;
  chartPoints: ProviderReportChartPoint[];
  description: string;
  lastRunLabel: string;
  metrics: ProviderReportMetric[];
  notes: string[];
  reportId: ProviderReportId;
  reportLabel: string;
  tableColumns: ProviderReportTableColumn[];
  tableRows: ProviderReportTableRow[];
}

const REPORT_OPTIONS: ProviderReportOption[] = [
  {
    id: 'operational-performance',
    label: 'Operational performance',
    description: 'Sessions kept, revenue posted, and same-day readiness across the clinic organization.'
  },
  {
    id: 'authorization-outlook',
    label: 'Authorization outlook',
    description: 'Upcoming visit pressure, expiring auths, and low remaining visits by location.'
  },
  {
    id: 'denial-recovery',
    label: 'Denial recovery',
    description: 'Denied claims, resubmission backlog, and recovered dollars by payer and team.'
  },
  {
    id: 'capacity-and-access',
    label: 'Capacity and access',
    description: 'Utilization, open capacity, and coverage gaps for centralized staffing decisions.'
  }
];

const HISTORICAL_OPERATIONAL_DATA: HistoricalOperationalRecord[] = [
  {
    weekStart: '2026-02-02',
    location: 'Flint Clinic',
    patientType: 'Early Learner',
    payer: 'Meridian Medicaid',
    therapist: 'Kayla Morris',
    supervisingClinician: 'Dr. Priya Shah',
    scheduledSessions: 48,
    completedSessions: 44,
    openCoverageGaps: 3,
    atRiskSessions: 5,
    expiringAuths: 4,
    expiredButScheduled: 1,
    lowRemainingVisits: 3,
    pendingAuthFollowUp: 2,
    claimsSubmitted: 41,
    claimsDenied: 5,
    pendingResubmissions: 4,
    recoveredClaims: 2,
    revenuePosted: 15840,
    revenueAtRisk: 3220,
    utilizationPercent: 92,
    openCapacitySlots: 6
  },
  {
    weekStart: '2026-02-09',
    location: 'Ann Arbor Clinic',
    patientType: 'School Age',
    payer: 'Blue Cross Blue Shield',
    therapist: 'Marcus Reed',
    supervisingClinician: 'Dr. Priya Shah',
    scheduledSessions: 44,
    completedSessions: 41,
    openCoverageGaps: 2,
    atRiskSessions: 4,
    expiringAuths: 3,
    expiredButScheduled: 1,
    lowRemainingVisits: 2,
    pendingAuthFollowUp: 1,
    claimsSubmitted: 38,
    claimsDenied: 4,
    pendingResubmissions: 3,
    recoveredClaims: 2,
    revenuePosted: 14960,
    revenueAtRisk: 2840,
    utilizationPercent: 88,
    openCapacitySlots: 5
  },
  {
    weekStart: '2026-02-16',
    location: 'Grand Blanc Home Team',
    patientType: 'Focused Care',
    payer: 'Aetna Better Health',
    therapist: 'Jasmine Patel',
    supervisingClinician: 'Dr. Aaron Fields',
    scheduledSessions: 39,
    completedSessions: 34,
    openCoverageGaps: 4,
    atRiskSessions: 6,
    expiringAuths: 5,
    expiredButScheduled: 2,
    lowRemainingVisits: 4,
    pendingAuthFollowUp: 3,
    claimsSubmitted: 31,
    claimsDenied: 6,
    pendingResubmissions: 4,
    recoveredClaims: 1,
    revenuePosted: 12320,
    revenueAtRisk: 3710,
    utilizationPercent: 79,
    openCapacitySlots: 8
  },
  {
    weekStart: '2026-02-23',
    location: 'Flint Clinic',
    patientType: 'School Age',
    payer: 'Meridian Medicaid',
    therapist: 'Alyssa Green',
    supervisingClinician: 'Dr. Aaron Fields',
    scheduledSessions: 46,
    completedSessions: 42,
    openCoverageGaps: 3,
    atRiskSessions: 4,
    expiringAuths: 4,
    expiredButScheduled: 1,
    lowRemainingVisits: 3,
    pendingAuthFollowUp: 2,
    claimsSubmitted: 40,
    claimsDenied: 5,
    pendingResubmissions: 3,
    recoveredClaims: 2,
    revenuePosted: 15210,
    revenueAtRisk: 2980,
    utilizationPercent: 95,
    openCapacitySlots: 5
  },
  {
    weekStart: '2026-03-02',
    location: 'Ann Arbor Clinic',
    patientType: 'Early Learner',
    payer: 'Blue Cross Blue Shield',
    therapist: 'Kayla Morris',
    supervisingClinician: 'Dr. Priya Shah',
    scheduledSessions: 50,
    completedSessions: 47,
    openCoverageGaps: 1,
    atRiskSessions: 3,
    expiringAuths: 2,
    expiredButScheduled: 0,
    lowRemainingVisits: 2,
    pendingAuthFollowUp: 1,
    claimsSubmitted: 44,
    claimsDenied: 3,
    pendingResubmissions: 2,
    recoveredClaims: 3,
    revenuePosted: 16740,
    revenueAtRisk: 2100,
    utilizationPercent: 97,
    openCapacitySlots: 3
  },
  {
    weekStart: '2026-03-09',
    location: 'Grand Blanc Home Team',
    patientType: 'School Age',
    payer: 'Aetna Better Health',
    therapist: 'Marcus Reed',
    supervisingClinician: 'Dr. Aaron Fields',
    scheduledSessions: 41,
    completedSessions: 36,
    openCoverageGaps: 5,
    atRiskSessions: 7,
    expiringAuths: 6,
    expiredButScheduled: 2,
    lowRemainingVisits: 5,
    pendingAuthFollowUp: 4,
    claimsSubmitted: 33,
    claimsDenied: 6,
    pendingResubmissions: 5,
    recoveredClaims: 1,
    revenuePosted: 12690,
    revenueAtRisk: 3960,
    utilizationPercent: 74,
    openCapacitySlots: 9
  },
  {
    weekStart: '2026-03-16',
    location: 'Flint Clinic',
    patientType: 'Focused Care',
    payer: 'Meridian Medicaid',
    therapist: 'Jasmine Patel',
    supervisingClinician: 'Dr. Priya Shah',
    scheduledSessions: 47,
    completedSessions: 43,
    openCoverageGaps: 2,
    atRiskSessions: 4,
    expiringAuths: 3,
    expiredButScheduled: 1,
    lowRemainingVisits: 3,
    pendingAuthFollowUp: 2,
    claimsSubmitted: 39,
    claimsDenied: 4,
    pendingResubmissions: 3,
    recoveredClaims: 2,
    revenuePosted: 15480,
    revenueAtRisk: 2875,
    utilizationPercent: 91,
    openCapacitySlots: 4
  },
  {
    weekStart: '2026-03-23',
    location: 'Ann Arbor Clinic',
    patientType: 'School Age',
    payer: 'Blue Cross Blue Shield',
    therapist: 'Alyssa Green',
    supervisingClinician: 'Dr. Aaron Fields',
    scheduledSessions: 45,
    completedSessions: 40,
    openCoverageGaps: 3,
    atRiskSessions: 5,
    expiringAuths: 4,
    expiredButScheduled: 1,
    lowRemainingVisits: 4,
    pendingAuthFollowUp: 2,
    claimsSubmitted: 36,
    claimsDenied: 5,
    pendingResubmissions: 4,
    recoveredClaims: 2,
    revenuePosted: 14890,
    revenueAtRisk: 3185,
    utilizationPercent: 84,
    openCapacitySlots: 6
  }
];

function uniqueValues(values: string[]) {
  return ['all', ...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function maxWeekStart() {
  return new Date(
    Math.max(...HISTORICAL_OPERATIONAL_DATA.map((entry) => Date.parse(entry.weekStart)))
  );
}

function resolveDateThreshold(range: ProviderReportDateRange) {
  const maxDate = maxWeekStart();
  const cutoff = new Date(maxDate);

  if (range === 'last_30_days') {
    cutoff.setDate(cutoff.getDate() - 30);
    return cutoff;
  }

  if (range === 'last_60_days') {
    cutoff.setDate(cutoff.getDate() - 60);
    return cutoff;
  }

  return new Date(maxDate.getFullYear(), maxDate.getMonth() - 2, 1);
}

function filterRecords(filters: ProviderReportingFilters) {
  const dateThreshold = resolveDateThreshold(filters.dateRange);

  return HISTORICAL_OPERATIONAL_DATA.filter((entry) => {
    const weekMatches = Date.parse(entry.weekStart) >= dateThreshold.getTime();
    const patientMatches =
      filters.patientType === 'all' || entry.patientType === filters.patientType;
    const locationMatches =
      filters.location === 'all' || entry.location === filters.location;
    const payerMatches = filters.payer === 'all' || entry.payer === filters.payer;
    const clinicianMatches =
      filters.clinician === 'all' ||
      entry.therapist === filters.clinician ||
      entry.supervisingClinician === filters.clinician;

    return weekMatches && patientMatches && locationMatches && payerMatches && clinicianMatches;
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function sumBy(records: HistoricalOperationalRecord[], key: keyof HistoricalOperationalRecord) {
  return records.reduce((total, record) => total + Number(record[key]), 0);
}

function averageBy(records: HistoricalOperationalRecord[], key: keyof HistoricalOperationalRecord) {
  if (records.length === 0) {
    return 0;
  }

  return sumBy(records, key) / records.length;
}

function buildOperationalPerformanceView(records: HistoricalOperationalRecord[]): ProviderReportView {
  const sessionsScheduled = sumBy(records, 'scheduledSessions');
  const sessionsCompleted = sumBy(records, 'completedSessions');
  const completionRate = sessionsScheduled > 0 ? (sessionsCompleted / sessionsScheduled) * 100 : 0;
  const revenuePosted = sumBy(records, 'revenuePosted');
  const revenueAtRisk = sumBy(records, 'revenueAtRisk');
  const atRiskSessions = sumBy(records, 'atRiskSessions');

  const rowsByLocation = uniqueValues(records.map((entry) => entry.location))
    .filter((location) => location !== 'all')
    .map((location) => {
      const locationRecords = records.filter((entry) => entry.location === location);
      const locationScheduled = sumBy(locationRecords, 'scheduledSessions');
      const locationCompleted = sumBy(locationRecords, 'completedSessions');
      const locationRate =
        locationScheduled > 0 ? Math.round((locationCompleted / locationScheduled) * 100) : 0;

      return {
        id: location,
        values: {
          location,
          sessions: `${locationCompleted}/${locationScheduled}`,
          keptRate: `${locationRate}%`,
          revenuePosted: formatCurrency(sumBy(locationRecords, 'revenuePosted')),
          atRisk: formatCurrency(sumBy(locationRecords, 'revenueAtRisk'))
        }
      };
    });

  return {
    reportId: 'operational-performance',
    reportLabel: 'Operational performance',
    description:
      'Review kept sessions, posted revenue, and same-day readiness trends across the ABA clinic organization.',
    metrics: [
      {
        label: 'Sessions kept',
        value: `${sessionsCompleted}/${sessionsScheduled}`,
        changeLabel: `${formatPercent(completionRate)} kept rate`,
        tone: completionRate >= 90 ? 'success' : completionRate >= 82 ? 'warning' : 'critical'
      },
      {
        label: 'Revenue posted',
        value: formatCurrency(revenuePosted),
        changeLabel: 'Historical posted charges in selected period',
        tone: 'info'
      },
      {
        label: 'Revenue at risk',
        value: formatCurrency(revenueAtRisk),
        changeLabel: `${atRiskSessions} sessions still vulnerable`,
        tone: revenueAtRisk > 10000 ? 'critical' : 'warning'
      },
      {
        label: 'Avg therapist utilization',
        value: formatPercent(averageBy(records, 'utilizationPercent')),
        changeLabel: 'Average weekly load across selected teams',
        tone: 'success'
      }
    ],
    chartCaption: 'Posted revenue by week',
    chartPoints: records.map((entry) => ({
      label: new Date(entry.weekStart).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      value: entry.revenuePosted,
      tone: entry.revenueAtRisk > 3200 ? 'warning' : 'success'
    })),
    tableColumns: [
      { key: 'location', label: 'Location' },
      { key: 'sessions', label: 'Sessions kept' },
      { key: 'keptRate', label: 'Kept rate', align: 'right' },
      { key: 'revenuePosted', label: 'Revenue posted', align: 'right' },
      { key: 'atRisk', label: 'Revenue at risk', align: 'right' }
    ],
    tableRows: rowsByLocation,
    notes: [
      'Revenue values are mock historical charges generated for the ABA demo tenant.',
      'Kept-rate performance helps centralized administration see where staffing and family engagement need support.',
      'Revenue at risk includes visits exposed to missing eligibility, expiring auths, and documentation lag.'
    ],
    lastRunLabel: 'Updated from historical mock clinic operations data'
  };
}

function buildAuthorizationOutlookView(records: HistoricalOperationalRecord[]): ProviderReportView {
  const expiringAuths = sumBy(records, 'expiringAuths');
  const expiredButScheduled = sumBy(records, 'expiredButScheduled');
  const lowVisits = sumBy(records, 'lowRemainingVisits');
  const pendingFollowUp = sumBy(records, 'pendingAuthFollowUp');

  const rows = uniqueValues(records.map((entry) => entry.location))
    .filter((location) => location !== 'all')
    .map((location) => {
      const locationRecords = records.filter((entry) => entry.location === location);
      return {
        id: location,
        values: {
          location,
          expiring: String(sumBy(locationRecords, 'expiringAuths')),
          expiredScheduled: String(sumBy(locationRecords, 'expiredButScheduled')),
          lowVisits: String(sumBy(locationRecords, 'lowRemainingVisits')),
          followUp: String(sumBy(locationRecords, 'pendingAuthFollowUp'))
        }
      };
    });

  return {
    reportId: 'authorization-outlook',
    reportLabel: 'Authorization outlook',
    description:
      'Track upcoming auth pressure, low remaining visits, and scheduled sessions that need centralized follow-up before next week breaks.',
    metrics: [
      {
        label: 'Auths due soon',
        value: String(expiringAuths),
        changeLabel: 'Expiring inside the selected reporting window',
        tone: expiringAuths >= 12 ? 'warning' : 'info'
      },
      {
        label: 'Expired but scheduled',
        value: String(expiredButScheduled),
        changeLabel: 'Children still on the calendar with no active auth',
        tone: expiredButScheduled > 0 ? 'critical' : 'success'
      },
      {
        label: 'Low visits remaining',
        value: String(lowVisits),
        changeLabel: 'Cases that could stall next week',
        tone: lowVisits >= 8 ? 'warning' : 'info'
      },
      {
        label: 'Pending follow-up',
        value: String(pendingFollowUp),
        changeLabel: 'Authorization actions still waiting on admin work',
        tone: pendingFollowUp >= 6 ? 'critical' : 'warning'
      }
    ],
    chartCaption: 'Expiring authorizations by week',
    chartPoints: records.map((entry) => ({
      label: new Date(entry.weekStart).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      value: entry.expiringAuths + entry.lowRemainingVisits,
      tone: entry.expiredButScheduled > 0 ? 'critical' : 'warning'
    })),
    tableColumns: [
      { key: 'location', label: 'Location' },
      { key: 'expiring', label: 'Due soon', align: 'right' },
      { key: 'expiredScheduled', label: 'Expired but scheduled', align: 'right' },
      { key: 'lowVisits', label: 'Low visits', align: 'right' },
      { key: 'followUp', label: 'Pending follow-up', align: 'right' }
    ],
    tableRows: rows,
    notes: [
      'Use this report to stage extension requests before low remaining visits become family-facing disruptions.',
      'Expired-but-scheduled counts should trigger same-day review with operations and authorization staff.',
      'In the demo environment, auth pressure is derived from historical mock clinic load and not payer APIs.'
    ],
    lastRunLabel: 'Uses historical authorization pressure patterns for the selected filters'
  };
}

function buildDenialRecoveryView(records: HistoricalOperationalRecord[]): ProviderReportView {
  const claimsDenied = sumBy(records, 'claimsDenied');
  const pendingResubmissions = sumBy(records, 'pendingResubmissions');
  const recoveredClaims = sumBy(records, 'recoveredClaims');
  const recoveredRevenue = Math.round(sumBy(records, 'revenueAtRisk') * 0.32);

  const rows = uniqueValues(records.map((entry) => entry.payer))
    .filter((payer) => payer !== 'all')
    .map((payer) => {
      const payerRecords = records.filter((entry) => entry.payer === payer);
      return {
        id: payer,
        values: {
          payer,
          denied: String(sumBy(payerRecords, 'claimsDenied')),
          resubmissions: String(sumBy(payerRecords, 'pendingResubmissions')),
          recovered: String(sumBy(payerRecords, 'recoveredClaims')),
          atRisk: formatCurrency(sumBy(payerRecords, 'revenueAtRisk'))
        }
      };
    });

  return {
    reportId: 'denial-recovery',
    reportLabel: 'Denial recovery',
    description:
      'See where claims are stalling, what still needs correction work, and which payer lanes are holding revenue back.',
    metrics: [
      {
        label: 'Denied claims',
        value: String(claimsDenied),
        changeLabel: 'Claims denied in the selected period',
        tone: claimsDenied >= 15 ? 'critical' : 'warning'
      },
      {
        label: 'Pending resubmissions',
        value: String(pendingResubmissions),
        changeLabel: 'Correction work still in queue',
        tone: pendingResubmissions >= 10 ? 'critical' : 'warning'
      },
      {
        label: 'Recovered claims',
        value: String(recoveredClaims),
        changeLabel: 'Claims moved back into acceptable status',
        tone: 'success'
      },
      {
        label: 'Recovered revenue',
        value: formatCurrency(recoveredRevenue),
        changeLabel: 'Estimated dollars protected by follow-up',
        tone: 'info'
      }
    ],
    chartCaption: 'Denied claims by week',
    chartPoints: records.map((entry) => ({
      label: new Date(entry.weekStart).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      value: entry.claimsDenied,
      tone: entry.claimsDenied >= 6 ? 'critical' : 'warning'
    })),
    tableColumns: [
      { key: 'payer', label: 'Payer' },
      { key: 'denied', label: 'Denied claims', align: 'right' },
      { key: 'resubmissions', label: 'Pending resubmissions', align: 'right' },
      { key: 'recovered', label: 'Recovered claims', align: 'right' },
      { key: 'atRisk', label: 'Revenue at risk', align: 'right' }
    ],
    tableRows: rows,
    notes: [
      'This mock report is built for centralized billing leads, not therapist workflow execution.',
      'Revenue at risk reflects denials, missing documentation, and unresolved resubmission items.',
      'Payer trends can be filtered further by location and clinician when central office teams need a narrower lane.'
    ],
    lastRunLabel: 'Historical mock billing activity refreshed for the current report filters'
  };
}

function buildCapacityAccessView(records: HistoricalOperationalRecord[]): ProviderReportView {
  const avgUtilization = averageBy(records, 'utilizationPercent');
  const openCapacitySlots = sumBy(records, 'openCapacitySlots');
  const coverageGaps = sumBy(records, 'openCoverageGaps');
  const overloadedTeams = records.filter((entry) => entry.utilizationPercent > 95).length;

  const rows = uniqueValues(records.map((entry) => entry.therapist))
    .filter((therapist) => therapist !== 'all')
    .map((therapist) => {
      const therapistRecords = records.filter((entry) => entry.therapist === therapist);
      return {
        id: therapist,
        values: {
          therapist,
          utilization: formatPercent(averageBy(therapistRecords, 'utilizationPercent')),
          openSlots: String(sumBy(therapistRecords, 'openCapacitySlots')),
          gaps: String(sumBy(therapistRecords, 'openCoverageGaps')),
          location: therapistRecords[0]?.location ?? 'Clinic'
        }
      };
    });

  return {
    reportId: 'capacity-and-access',
    reportLabel: 'Capacity and access',
    description:
      'Measure therapist load, open capacity, and scheduling pressure so centralized admin can rebalance staff before families feel the impact.',
    metrics: [
      {
        label: 'Avg utilization',
        value: formatPercent(avgUtilization),
        changeLabel: 'Average scheduled load across selected resources',
        tone: avgUtilization > 95 ? 'critical' : avgUtilization >= 75 ? 'success' : 'warning'
      },
      {
        label: 'Open capacity',
        value: String(openCapacitySlots),
        changeLabel: 'Slots still available to absorb demand',
        tone: openCapacitySlots >= 12 ? 'success' : 'warning'
      },
      {
        label: 'Coverage gaps',
        value: String(coverageGaps),
        changeLabel: 'Open therapist coverage gaps still on the board',
        tone: coverageGaps >= 10 ? 'critical' : 'warning'
      },
      {
        label: 'Overloaded teams',
        value: String(overloadedTeams),
        changeLabel: 'Resources above the healthy operating band',
        tone: overloadedTeams > 0 ? 'critical' : 'success'
      }
    ],
    chartCaption: 'Average utilization by week',
    chartPoints: records.map((entry) => ({
      label: new Date(entry.weekStart).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      value: entry.utilizationPercent,
      tone:
        entry.utilizationPercent > 95
          ? 'critical'
          : entry.utilizationPercent >= 75
            ? 'success'
            : 'warning'
    })),
    tableColumns: [
      { key: 'therapist', label: 'Therapist' },
      { key: 'location', label: 'Location' },
      { key: 'utilization', label: 'Avg utilization', align: 'right' },
      { key: 'openSlots', label: 'Open capacity', align: 'right' },
      { key: 'gaps', label: 'Coverage gaps', align: 'right' }
    ],
    tableRows: rows,
    notes: [
      'Capacity reporting is meant for centralized scheduling and clinic administration, not therapist self-management.',
      'Utilization below target can signal fill opportunities; utilization above 95% usually signals staffing strain.',
      'Open capacity and gap counts are generated from the same ABA mock scheduling assumptions used in the provider demo.'
    ],
    lastRunLabel: 'Calculated from historical mock schedule demand and staffing patterns'
  };
}

export function getProviderReportingOptions() {
  return {
    reports: REPORT_OPTIONS,
    dateRanges: [
      { value: 'last_30_days', label: 'Last 30 days' },
      { value: 'last_60_days', label: 'Last 60 days' },
      { value: 'quarter_to_date', label: 'Quarter to date' }
    ],
    patientTypes: uniqueValues(HISTORICAL_OPERATIONAL_DATA.map((entry) => entry.patientType)),
    locations: uniqueValues(HISTORICAL_OPERATIONAL_DATA.map((entry) => entry.location)),
    payers: uniqueValues(HISTORICAL_OPERATIONAL_DATA.map((entry) => entry.payer)),
    clinicians: uniqueValues(
      HISTORICAL_OPERATIONAL_DATA.flatMap((entry) => [
        entry.therapist,
        entry.supervisingClinician
      ])
    )
  };
}

export function createDefaultProviderReportingFilters(): ProviderReportingFilters {
  return {
    reportId: 'operational-performance',
    dateRange: 'last_60_days',
    patientType: 'all',
    location: 'all',
    payer: 'all',
    clinician: 'all'
  };
}

export function buildProviderReportView(filters: ProviderReportingFilters): ProviderReportView {
  const filteredRecords = filterRecords(filters);

  if (filters.reportId === 'authorization-outlook') {
    return buildAuthorizationOutlookView(filteredRecords);
  }

  if (filters.reportId === 'denial-recovery') {
    return buildDenialRecoveryView(filteredRecords);
  }

  if (filters.reportId === 'capacity-and-access') {
    return buildCapacityAccessView(filteredRecords);
  }

  return buildOperationalPerformanceView(filteredRecords);
}
