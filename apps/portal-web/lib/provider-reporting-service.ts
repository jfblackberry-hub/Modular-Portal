import {
  buildProviderReportingStaticOptions,
  formatProviderReportFilterLabel,
  type ProviderReportChart,
  type ProviderReportDateRange,
  type ProviderReportingFilters,
  type ProviderReportMetric,
  type ProviderReportTable,
  type ProviderReportTableColumn,
  type ProviderReportTableRow,
  type ProviderReportTone,
  type ProviderReportView} from './provider-reporting';
import {
  getProviderReportingWarehouse,
  type ProviderReportingWarehouse,
  type ReportingWarehouseAuthorization,
  type ReportingWarehouseClaim,
  type ReportingWarehouseEligibilityCheck,
  type ReportingWarehousePatient,
  type ReportingWarehouseSession,
  type ReportingWarehouseStaff
} from './provider-reporting-warehouse';

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

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function formatMonthLabel(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit'
  });
}

function rangeStart(range: ProviderReportDateRange) {
  const today = new Date('2026-03-26T12:00:00Z');

  if (range === 'last_30_days') {
    return addDays(today, -30);
  }
  if (range === 'last_90_days') {
    return addDays(today, -90);
  }
  if (range === 'last_180_days') {
    return addDays(today, -180);
  }
  if (range === 'year_to_date') {
    return new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  }
  if (range === 'last_12_months') {
    return new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), 1));
  }

  return new Date(Date.UTC(today.getUTCFullYear() - 2, today.getUTCMonth(), 1));
}

function valueMatches(filterValue: string, recordValue: string | null | undefined) {
  return filterValue === 'all' || recordValue === filterValue;
}

function uniqueOptions(values: string[]) {
  const unique = [...new Set(values)].sort((left, right) => left.localeCompare(right));
  return [{ label: 'All', value: 'all' }, ...unique.map((value) => ({ label: value, value }))];
}

function monthlySeries<T>(
  items: T[],
  dateResolver: (item: T) => string,
  reducer: (items: T[]) => number
) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const monthKey = dateResolver(item).slice(0, 7);
    const bucket = grouped.get(monthKey) ?? [];
    bucket.push(item);
    grouped.set(monthKey, bucket);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([monthKey, groupedItems]) => ({
      label: formatMonthLabel(`${monthKey}-01`),
      value: reducer(groupedItems)
    }));
}

function toneFromPercent(percent: number): ProviderReportTone {
  if (percent >= 92) return 'success';
  if (percent >= 80) return 'info';
  if (percent >= 68) return 'warning';
  return 'critical';
}

function buildAppliedFiltersLabel(filters: ProviderReportingFilters) {
  return [
    filters.dateRange,
    filters.location,
    filters.patientType,
    filters.payer,
    filters.therapist,
    filters.supervisingClinician
  ]
    .filter((value) => value !== 'all')
    .map(formatProviderReportFilterLabel)
    .join(' · ') || 'Clinic-wide view';
}

type FilteredWarehouse = {
  authorizations: ReportingWarehouseAuthorization[];
  claims: ReportingWarehouseClaim[];
  eligibilityChecks: ReportingWarehouseEligibilityCheck[];
  patients: ReportingWarehousePatient[];
  sessions: ReportingWarehouseSession[];
  staff: ReportingWarehouseStaff[];
};

function filterWarehouse(
  warehouse: ProviderReportingWarehouse,
  filters: ProviderReportingFilters
): FilteredWarehouse {
  const start = rangeStart(filters.dateRange);

  const patients = warehouse.patients.filter((patient) => {
    const patientStart = new Date(patient.startDate);
    return (
      patientStart >= addDays(start, -365) &&
      valueMatches(filters.location, patient.primaryLocationName) &&
      valueMatches(filters.patientType, patient.patientType) &&
      valueMatches(filters.payer, patient.payer) &&
      valueMatches(filters.therapist, patient.therapistName) &&
      valueMatches(filters.supervisingClinician, patient.supervisingClinicianName) &&
      valueMatches(filters.status, patient.status)
    );
  });

  const patientIds = new Set(patients.map((patient) => patient.id));

  const sessions = warehouse.sessions.filter((session) => {
    const date = new Date(session.date);
    return (
      patientIds.has(session.patientId) &&
      date >= start &&
      valueMatches(filters.serviceSetting, session.serviceSetting) &&
      valueMatches(filters.status, session.sessionStatus)
    );
  });

  const authorizations = warehouse.authorizations.filter((authorization) => {
    const startDate = new Date(authorization.startDate);
    const endDate = new Date(authorization.endDate);
    return (
      patientIds.has(authorization.patientId) &&
      endDate >= start &&
      startDate <= addDays(new Date('2026-03-26T12:00:00Z'), 1) &&
      valueMatches(filters.authorizationStatus, authorization.status)
    );
  });

  const eligibilityChecks = warehouse.eligibilityChecks.filter((check) => {
    const date = new Date(check.serviceDate);
    return (
      patientIds.has(check.patientId) &&
      date >= start &&
      valueMatches(filters.status, check.status)
    );
  });

  const claims = warehouse.claims.filter((claim) => {
    const submissionDate = new Date(claim.submissionDate);
    return (
      patientIds.has(claim.patientId) &&
      submissionDate >= start &&
      valueMatches(filters.claimStatus, claim.status) &&
      valueMatches(filters.denialReason, claim.denialReason ?? 'none')
    );
  });

  const staffIds = new Set([
    ...patients.map((patient) => patient.therapistId),
    ...patients.map((patient) => patient.supervisingClinicianId)
  ]);
  const staff = warehouse.staff.filter((record) => staffIds.has(record.id));

  return {
    patients,
    sessions,
    authorizations,
    eligibilityChecks,
    claims,
    staff
  };
}

function makeMetric(
  label: string,
  value: string,
  changeLabel: string,
  tone: ProviderReportTone
): ProviderReportMetric {
  return { label, value, changeLabel, tone };
}

function makeTable(
  title: string,
  description: string,
  columns: ProviderReportTableColumn[],
  rows: ProviderReportTableRow[]
): ProviderReportTable {
  return { title, description, columns, rows };
}

function tableRow(id: string, values: Record<string, string>): ProviderReportTableRow {
  return { id, values };
}

function trendChart(
  title: string,
  subtitle: string,
  data: Array<{ label: string; value: number; tone: ProviderReportTone }>
): ProviderReportChart {
  return { id: title.toLowerCase().replaceAll(/\s+/g, '-'), title, subtitle, type: 'trend', format: 'count', data };
}

function comparisonChart(
  title: string,
  subtitle: string,
  data: Array<{ label: string; value: number; tone: ProviderReportTone; detail?: string }>,
  format: ProviderReportChart['format'] = 'count'
): ProviderReportChart {
  return { id: title.toLowerCase().replaceAll(/\s+/g, '-'), title, subtitle, type: 'comparison', format, data };
}

function distributionChart(
  title: string,
  subtitle: string,
  data: Array<{ label: string; value: number; tone: ProviderReportTone }>
): ProviderReportChart {
  return { id: title.toLowerCase().replaceAll(/\s+/g, '-'), title, subtitle, type: 'distribution', format: 'count', data };
}

function buildPatientCensusReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const activePatients = data.patients.filter((patient) => patient.status === 'active');
  const inactivePatients = data.patients.filter((patient) => patient.status !== 'active');
  const rangeStartDate = rangeStart(filters.dateRange);
  const newStarts = data.patients.filter((patient) => new Date(patient.startDate) >= rangeStartDate);
  const discharges = data.patients.filter(
    (patient) => patient.dischargeDate && new Date(patient.dischargeDate) >= rangeStartDate
  );

  const locationRows = [...new Set(data.patients.map((patient) => patient.primaryLocationName))]
    .sort((left, right) => left.localeCompare(right))
    .map((location) => {
      const rows = data.patients.filter((patient) => patient.primaryLocationName === location);
      return tableRow(location, {
        location,
        activePatients: String(rows.filter((patient) => patient.status === 'active').length),
        inactivePatients: String(rows.filter((patient) => patient.status !== 'active').length),
        newStarts: String(rows.filter((patient) => new Date(patient.startDate) >= rangeStartDate).length),
        discharges: String(rows.filter((patient) => patient.dischargeDate && new Date(patient.dischargeDate) >= rangeStartDate).length)
      });
    });

  return {
    reportId: 'patient-census',
    reportLabel: 'Patient Census Report',
    description: 'Understand active census, new starts, discharges, and patient mix across the ABA clinic organization.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Mock clinic warehouse refreshed through Mar 26, 2026',
    lastRunLabel: 'Generated from 24 months of mock census history',
    recordCount: data.patients.length,
    metrics: [
      makeMetric('Active patients', String(activePatients.length), 'Current census under active care', 'success'),
      makeMetric('Inactive / discharged', String(inactivePatients.length), 'Patients no longer actively receiving services', 'info'),
      makeMetric('New starts', String(newStarts.length), 'Patients admitted in the selected period', 'warning'),
      makeMetric('Discharges', String(discharges.length), 'Patients discharged in the selected period', 'info')
    ],
    charts: [
      trendChart(
        'Census trend by month',
        'Monthly active patient census over the selected time window.',
        monthlySeries(data.patients, (patient) => patient.startDate, (items) => items.length).map((entry) => ({
          ...entry,
          tone: 'info' as ProviderReportTone
        }))
      ),
      distributionChart(
        'Patient mix by patient type',
        'Current census mix for the selected filters.',
        [...new Set(data.patients.map((patient) => patient.patientType))]
          .sort((left, right) => left.localeCompare(right))
          .map((patientType) => ({
            label: patientType,
            value: data.patients.filter((patient) => patient.patientType === patientType && patient.status === 'active').length,
            tone: 'success' as ProviderReportTone
          }))
      )
    ],
    table: makeTable(
      'Census by location',
      'Compare active census, starts, and discharges by operating location.',
      [
        { key: 'location', label: 'Location' },
        { key: 'activePatients', label: 'Active', align: 'right' },
        { key: 'inactivePatients', label: 'Inactive / discharged', align: 'right' },
        { key: 'newStarts', label: 'New starts', align: 'right' },
        { key: 'discharges', label: 'Discharges', align: 'right' }
      ],
      locationRows
    ),
    notes: [
      'Patient census includes active, inactive, and discharged records across approximately 300 patients.',
      'Use this report to see where new-start growth is landing and where discharge volume is changing census pressure.',
      'The mock warehouse keeps patient-location history anchored to the primary operating location for business reporting.'
    ]
  };
}

function buildSessionsDeliveredReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const scheduled = data.sessions.length;
  const completed = data.sessions.filter((session) => session.sessionStatus === 'completed').length;
  const cancelled = data.sessions.filter((session) => session.sessionStatus === 'cancelled').length;
  const noShows = data.sessions.filter((session) => session.sessionStatus === 'no_show').length;
  const completionRate = scheduled > 0 ? (completed / scheduled) * 100 : 0;

  const therapistRows = [...new Set(data.sessions.map((session) => session.therapistName))]
    .sort((left, right) => left.localeCompare(right))
    .slice(0, 12)
    .map((therapist) => {
      const sessions = data.sessions.filter((session) => session.therapistName === therapist);
      const scheduledSessions = sessions.length;
      const completedSessions = sessions.filter((session) => session.sessionStatus === 'completed').length;
      return tableRow(therapist, {
        therapist,
        location: sessions[0]?.locationName ?? 'Clinic',
        scheduled: String(scheduledSessions),
        completed: String(completedSessions),
        cancelled: String(sessions.filter((session) => session.sessionStatus === 'cancelled').length),
        noShows: String(sessions.filter((session) => session.sessionStatus === 'no_show').length),
        completionRate: formatPercent(scheduledSessions > 0 ? (completedSessions / scheduledSessions) * 100 : 0)
      });
    });

  return {
    reportId: 'sessions-delivered',
    reportLabel: 'Sessions Delivered Report',
    description: 'Track scheduled, completed, canceled, and no-show sessions with weekly and monthly trend visibility.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Session history loaded from 24 months of mock warehouse activity',
    lastRunLabel: 'Summarized from scheduled and delivered session records',
    recordCount: data.sessions.length,
    metrics: [
      makeMetric('Sessions scheduled', String(scheduled), 'Scheduled sessions in the selected period', 'info'),
      makeMetric('Sessions completed', String(completed), 'Delivered sessions ready for downstream billing', 'success'),
      makeMetric('Cancelled sessions', String(cancelled), 'Sessions lost before delivery', cancelled > 150 ? 'warning' : 'info'),
      makeMetric('Completion rate', formatPercent(completionRate), 'Completed divided by scheduled sessions', toneFromPercent(completionRate))
    ],
    charts: [
      trendChart(
        'Sessions completed by month',
        'Monthly completed session throughput.',
        monthlySeries(
          data.sessions.filter((session) => session.sessionStatus === 'completed'),
          (session) => session.date,
          (items) => items.length
        ).map((entry) => ({ ...entry, tone: 'success' as ProviderReportTone }))
      ),
      comparisonChart(
        'Session status breakdown',
        'Compare completed, canceled, and no-show volume.',
        [
          { label: 'Completed', value: completed, tone: 'success' as ProviderReportTone },
          { label: 'Cancelled', value: cancelled, tone: 'warning' as ProviderReportTone },
          { label: 'No-shows', value: noShows, tone: 'critical' as ProviderReportTone },
          { label: 'Still scheduled', value: data.sessions.filter((session) => session.sessionStatus === 'scheduled').length, tone: 'info' as ProviderReportTone }
        ]
      )
    ],
    table: makeTable(
      'Sessions by therapist',
      'Use this table to compare throughput and disruption patterns across therapists.',
      [
        { key: 'therapist', label: 'Therapist' },
        { key: 'location', label: 'Location' },
        { key: 'scheduled', label: 'Scheduled', align: 'right' },
        { key: 'completed', label: 'Completed', align: 'right' },
        { key: 'cancelled', label: 'Cancelled', align: 'right' },
        { key: 'noShows', label: 'No-shows', align: 'right' },
        { key: 'completionRate', label: 'Completion rate', align: 'right' }
      ],
      therapistRows
    ),
    notes: [
      'Use the therapist and service-setting filters to isolate where throughput is slipping.',
      'Completion rate combines cancellations and no-shows to show what central operations can recover.',
      'Session history is generated from a two-year ABA scheduling dataset with realistic variation by location and patient type.'
    ]
  };
}

function buildAuthorizationUtilizationReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const activeAuths = data.authorizations.filter((auth) => auth.status === 'active');
  const expiring = data.authorizations.filter((auth) => auth.status === 'expiring_soon');
  const lowRemaining = data.authorizations.filter((auth) => auth.status === 'low_remaining');
  const expired = data.authorizations.filter((auth) => auth.status === 'expired');
  const expiredScheduledPatientIds = new Set(expired.map((auth) => auth.patientId));
  const expiredButScheduled = data.sessions.filter(
    (session) =>
      expiredScheduledPatientIds.has(session.patientId) &&
      (session.sessionStatus === 'scheduled' || session.sessionStatus === 'completed')
  ).length;

  const patientMap = new Map(data.patients.map((patient) => [patient.id, patient]));
  const rows = data.authorizations
    .slice()
    .sort((left, right) => left.remainingVisits - right.remainingVisits)
    .slice(0, 15)
    .map((auth) => {
      const patient = patientMap.get(auth.patientId);
      return tableRow(auth.id, {
        patient: patient ? `${patient.firstName} ${patient.lastName}` : auth.patientId,
        location: auth.locationName,
        payer: auth.payer,
        status: formatProviderReportFilterLabel(auth.status),
        remainingVisits: String(auth.remainingVisits),
        totalVisits: String(auth.totalVisits),
        period: `${auth.startDate} to ${auth.endDate}`
      });
    });

  return {
    reportId: 'authorization-utilization',
    reportLabel: 'Authorization Utilization Report',
    description: 'Track authorization depletion, low remaining visits, and expiration risk before sessions are affected.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Authorization history derived from patient load and visit usage',
    lastRunLabel: 'Updated from historical authorization usage patterns',
    recordCount: data.authorizations.length,
    metrics: [
      makeMetric('Active authorizations', String(activeAuths.length), 'Currently active authorizations in the selected filters', 'success'),
      makeMetric('Expiring soon', String(expiring.length), 'Authorizations approaching end date', 'warning'),
      makeMetric('Low remaining visits', String(lowRemaining.length), 'Authorizations with four or fewer visits remaining', lowRemaining.length > 12 ? 'critical' : 'warning'),
      makeMetric('Expired but recently scheduled', String(expiredButScheduled), 'Sessions attached to expired authorizations', expiredButScheduled > 0 ? 'critical' : 'success')
    ],
    charts: [
      comparisonChart(
        'Authorization status mix',
        'Volume by authorization status for the selected filters.',
        [
          { label: 'Active', value: activeAuths.length, tone: 'success' as ProviderReportTone },
          { label: 'Expiring soon', value: expiring.length, tone: 'warning' as ProviderReportTone },
          { label: 'Low remaining', value: lowRemaining.length, tone: 'warning' as ProviderReportTone },
          { label: 'Expired', value: expired.length, tone: 'critical' as ProviderReportTone }
        ]
      ),
      trendChart(
        'Authorization depletion trend',
        'Low-remaining and expiring authorization counts by month.',
        monthlySeries(
          data.authorizations.filter((auth) => auth.status === 'low_remaining' || auth.status === 'expiring_soon'),
          (auth) => auth.endDate,
          (items) => items.length
        ).map((entry) => ({ ...entry, tone: 'warning' as ProviderReportTone }))
      )
    ],
    table: makeTable(
      'Highest-risk authorizations',
      'Prioritize cases that are nearest to depletion or expiration.',
      [
        { key: 'patient', label: 'Patient' },
        { key: 'location', label: 'Location' },
        { key: 'payer', label: 'Payer' },
        { key: 'status', label: 'Status' },
        { key: 'remainingVisits', label: 'Remaining', align: 'right' },
        { key: 'totalVisits', label: 'Authorized', align: 'right' },
        { key: 'period', label: 'Authorization window' }
      ],
      rows
    ),
    notes: [
      'Use payer and location filters together to find authorization pressure that needs centralized follow-up.',
      'Expired-but-scheduled activity is a strong operational risk signal and should be paired with scheduling review.',
      'Remaining visits are derived from completed sessions against authorized visit counts.'
    ]
  };
}

function buildEligibilityReadinessReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const verified = data.eligibilityChecks.filter((check) => check.status === 'verified');
  const unverified = data.eligibilityChecks.filter((check) => check.status === 'unverified');
  const failed = data.eligibilityChecks.filter((check) => check.status === 'failed');
  const readinessIssues = data.sessions.filter(
    (session) => session.sessionStatus === 'scheduled' || !session.supervisionCompleted
  );

  const rows = [...new Set(data.eligibilityChecks.map((check) => check.locationName))]
    .sort((left, right) => left.localeCompare(right))
    .map((location) => {
      const checks = data.eligibilityChecks.filter((check) => check.locationName === location);
      return tableRow(location, {
        location,
        verified: String(checks.filter((check) => check.status === 'verified').length),
        unverified: String(checks.filter((check) => check.status === 'unverified').length),
        failed: String(checks.filter((check) => check.status === 'failed').length),
        readinessIssues: String(
          readinessIssues.filter((session) => session.locationName === location).length
        )
      });
    });

  return {
    reportId: 'eligibility-readiness',
    reportLabel: 'Eligibility and Readiness Report',
    description: 'Understand visit verification performance and readiness blockers before they turn into non-billable care.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Eligibility outcomes and readiness signals refreshed from mock session history',
    lastRunLabel: 'Built from eligibility checks and supervision readiness data',
    recordCount: data.eligibilityChecks.length,
    metrics: [
      makeMetric('Verified sessions', String(verified.length), 'Sessions with successful eligibility confirmation', 'success'),
      makeMetric('Unverified sessions', String(unverified.length), 'Sessions still lacking eligibility confirmation', unverified.length > 80 ? 'warning' : 'info'),
      makeMetric('Failed checks', String(failed.length), 'Eligibility checks that returned a failure result', failed.length > 35 ? 'critical' : 'warning'),
      makeMetric('Readiness issues', String(readinessIssues.length), 'Sessions with verification or supervision gaps', readinessIssues.length > 120 ? 'critical' : 'warning')
    ],
    charts: [
      trendChart(
        'Eligibility checks by month',
        'Monthly verification volume across the selected filters.',
        monthlySeries(data.eligibilityChecks, (check) => check.serviceDate, (items) => items.length).map((entry) => ({
          ...entry,
          tone: 'info' as ProviderReportTone
        }))
      ),
      comparisonChart(
        'Verification outcome mix',
        'Verified vs unverified vs failed checks.',
        [
          { label: 'Verified', value: verified.length, tone: 'success' as ProviderReportTone },
          { label: 'Unverified', value: unverified.length, tone: 'warning' as ProviderReportTone },
          { label: 'Failed', value: failed.length, tone: 'critical' as ProviderReportTone }
        ]
      )
    ],
    table: makeTable(
      'Readiness by location',
      'Use this view to identify which locations are struggling with verification and readiness follow-up.',
      [
        { key: 'location', label: 'Location' },
        { key: 'verified', label: 'Verified', align: 'right' },
        { key: 'unverified', label: 'Unverified', align: 'right' },
        { key: 'failed', label: 'Failed', align: 'right' },
        { key: 'readinessIssues', label: 'Readiness issues', align: 'right' }
      ],
      rows
    ),
    notes: [
      'Readiness issues combine verification misses and sessions lacking expected supervision completion.',
      'This report helps central office teams find where same-day visit risk is clustering by location.',
      'Use status filters to isolate just failed checks or just unverified visits.'
    ]
  };
}

function buildClaimsRevenueReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const billed = data.claims.reduce((sum, claim) => sum + claim.amountBilled, 0);
  const paid = data.claims.reduce((sum, claim) => sum + claim.amountPaid, 0);
  const denied = data.claims.filter((claim) => claim.status === 'denied').length;
  const pending = data.claims.filter((claim) => claim.status === 'pending' || claim.status === 'submitted').length;
  const denialRate = data.claims.length > 0 ? (denied / data.claims.length) * 100 : 0;

  const rows = [...new Set(data.claims.map((claim) => claim.payer))]
    .sort((left, right) => left.localeCompare(right))
    .map((payer) => {
      const claims = data.claims.filter((claim) => claim.payer === payer);
      return tableRow(payer, {
        payer,
        submitted: String(claims.length),
        denied: String(claims.filter((claim) => claim.status === 'denied').length),
        billed: formatCurrency(claims.reduce((sum, claim) => sum + claim.amountBilled, 0)),
        paid: formatCurrency(claims.reduce((sum, claim) => sum + claim.amountPaid, 0)),
        atRisk: formatCurrency(claims.reduce((sum, claim) => sum + claim.outstandingAmount, 0))
      });
    });

  return {
    reportId: 'claims-revenue',
    reportLabel: 'Claims and Revenue Report',
    description: 'Understand claims submitted, paid, denied, and dollars still at risk across the ABA clinic organization.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Claims and payment history loaded from the mock revenue cycle warehouse',
    lastRunLabel: 'Updated from 24 months of claims, denials, and payment outcomes',
    recordCount: data.claims.length,
    metrics: [
      makeMetric('Claims submitted', String(data.claims.length), 'All claims matching the selected filters', 'info'),
      makeMetric('Amount billed', formatCurrency(billed), 'Total billed charges in the selected period', 'info'),
      makeMetric('Amount paid', formatCurrency(paid), 'Paid dollars posted back from mock remittance activity', 'success'),
      makeMetric('Denial rate', formatPercent(denialRate), `${denied} denied claims · ${pending} still pending`, denialRate >= 12 ? 'critical' : denialRate >= 7 ? 'warning' : 'success')
    ],
    charts: [
      trendChart(
        'Billed revenue by month',
        'Monthly billed charges from completed therapy sessions.',
        monthlySeries(data.claims, (claim) => claim.submissionDate, (items) => items.reduce((sum, claim) => sum + claim.amountBilled, 0)).map((entry) => ({
          ...entry,
          tone: 'info' as ProviderReportTone
        }))
      ),
      comparisonChart(
        'Denials by payer',
        'Compare denial counts and dollars at risk across payer lanes.',
        rows.map((row) => ({
          label: row.values.payer,
          value: Number(row.values.denied),
          detail: row.values.atRisk,
          tone: Number(row.values.denied) >= 60 ? 'critical' : 'warning'
        }))
      )
    ],
    table: makeTable(
      'Claims summary by payer',
      'Use this table to understand where billed dollars are converting to paid dollars and where risk is accumulating.',
      [
        { key: 'payer', label: 'Payer' },
        { key: 'submitted', label: 'Claims', align: 'right' },
        { key: 'denied', label: 'Denied', align: 'right' },
        { key: 'billed', label: 'Billed', align: 'right' },
        { key: 'paid', label: 'Paid', align: 'right' },
        { key: 'atRisk', label: 'At risk', align: 'right' }
      ],
      rows
    ),
    notes: [
      'This report is tuned for centralized billing leadership, not therapist workflow.',
      'Dollar amount at risk reflects unpaid allowed amounts and unresolved denials.',
      'Use payer and location filters together to isolate where denial pressure is accumulating.'
    ]
  };
}

function buildDenialsResubmissionsReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const deniedClaims = data.claims.filter((claim) => claim.status === 'denied');
  const resubmittedClaims = data.claims.filter((claim) => claim.status === 'resubmitted');
  const resolvedResubmissions = resubmittedClaims.filter((claim) => claim.resubmissionResolved);
  const unresolvedBacklog = deniedClaims.filter((claim) => !claim.resubmissionDate).length;
  const successRate = resubmittedClaims.length > 0 ? (resolvedResubmissions.length / resubmittedClaims.length) * 100 : 0;

  const rows = [...new Set(deniedClaims.map((claim) => claim.denialReason ?? 'other'))]
    .sort((left, right) => left.localeCompare(right))
    .map((reason) => {
      const claims = deniedClaims.filter((claim) => (claim.denialReason ?? 'other') === reason);
      const resubmissions = data.claims.filter(
        (claim) => (claim.denialReason ?? 'other') === reason && claim.status === 'resubmitted'
      );
      return tableRow(reason, {
        denialReason: formatProviderReportFilterLabel(reason),
        denied: String(claims.length),
        resubmissions: String(resubmissions.length),
        successRate: formatPercent(
          resubmissions.length > 0
            ? (resubmissions.filter((claim) => claim.resubmissionResolved).length / resubmissions.length) * 100
            : 0
        ),
        openBacklog: String(claims.filter((claim) => !claim.resubmissionDate).length)
      });
    });

  return {
    reportId: 'denials-resubmissions',
    reportLabel: 'Denials and Resubmissions Report',
    description: 'Isolate denial patterns, resubmission success, and unresolved denial backlog for centralized follow-up.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Denial and recovery signals refreshed from mock claims history',
    lastRunLabel: 'Updated from denial outcomes and resubmission activity',
    recordCount: deniedClaims.length,
    metrics: [
      makeMetric('Denied claims', String(deniedClaims.length), 'Denied claims in the selected reporting window', deniedClaims.length > 140 ? 'critical' : 'warning'),
      makeMetric('Resubmissions', String(resubmittedClaims.length), 'Claims moved into resubmission workflow', 'info'),
      makeMetric('Resubmission success', formatPercent(successRate), 'Resolved resubmissions divided by all resubmissions', successRate >= 70 ? 'success' : successRate >= 50 ? 'warning' : 'critical'),
      makeMetric('Open backlog', String(unresolvedBacklog), 'Denied claims still waiting on correction work', unresolvedBacklog > 80 ? 'critical' : 'warning')
    ],
    charts: [
      comparisonChart(
        'Denials by reason',
        'Most common denial reasons for the selected filters.',
        rows.map((row) => ({
          label: row.values.denialReason,
          value: Number(row.values.denied),
          detail: `${row.values.openBacklog} open`,
          tone: Number(row.values.openBacklog) > 35 ? 'critical' : 'warning'
        }))
      ),
      trendChart(
        'Resubmission volume by month',
        'Monthly movement into resubmission workflow.',
        monthlySeries(resubmittedClaims, (claim) => claim.resubmissionDate ?? claim.submissionDate, (items) => items.length).map((entry) => ({
          ...entry,
          tone: 'info' as ProviderReportTone
        }))
      )
    ],
    table: makeTable(
      'Denial recovery by reason',
      'Use this table to understand where denial work is resolving and where backlog is getting stuck.',
      [
        { key: 'denialReason', label: 'Denial reason' },
        { key: 'denied', label: 'Denied', align: 'right' },
        { key: 'resubmissions', label: 'Resubmissions', align: 'right' },
        { key: 'successRate', label: 'Success rate', align: 'right' },
        { key: 'openBacklog', label: 'Open backlog', align: 'right' }
      ],
      rows
    ),
    notes: [
      'Authorization, eligibility, coding, and documentation are the core denial categories in the mock ABA revenue cycle.',
      'Open backlog counts unresolved denials without a resubmission action on file.',
      'This report is intended to help centralized admin identify the easiest recovery opportunities first.'
    ]
  };
}

function buildTherapistUtilizationReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const therapistRows = [...new Set(data.sessions.map((session) => session.therapistName))]
    .sort((left, right) => left.localeCompare(right))
    .map((therapist) => {
      const sessions = data.sessions.filter((session) => session.therapistName === therapist);
      const scheduled = sessions.length;
      const completed = sessions.filter((session) => session.sessionStatus === 'completed').length;
      const weeklyCapacity = Math.max(32, Math.round(scheduled / 4) + 6);
      const utilization = weeklyCapacity > 0 ? (completed / weeklyCapacity) * 100 : 0;

      return {
        therapist,
        location: sessions[0]?.locationName ?? 'Clinic',
        scheduled,
        completed,
        weeklyCapacity,
        utilization
      };
    });

  const underutilized = therapistRows.filter((row) => row.utilization < 70).length;
  const overloaded = therapistRows.filter((row) => row.utilization > 95).length;
  const avgUtilization =
    therapistRows.length > 0
      ? therapistRows.reduce((sum, row) => sum + row.utilization, 0) / therapistRows.length
      : 0;

  return {
    reportId: 'therapist-utilization',
    reportLabel: 'Therapist Utilization Report',
    description: 'Compare therapist capacity, completed sessions, and utilization health across the organization.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Utilization calculated from historical scheduling and completion data',
    lastRunLabel: 'Derived from therapist session load in the selected period',
    recordCount: therapistRows.length,
    metrics: [
      makeMetric('Average utilization', formatPercent(avgUtilization), 'Average therapist utilization across filtered teams', toneFromPercent(avgUtilization)),
      makeMetric('Underutilized therapists', String(underutilized), 'Therapists below the healthy utilization band', underutilized > 5 ? 'warning' : 'info'),
      makeMetric('Overloaded therapists', String(overloaded), 'Therapists above 95% utilization', overloaded > 0 ? 'critical' : 'success'),
      makeMetric('Completed sessions', String(data.sessions.filter((session) => session.sessionStatus === 'completed').length), 'Completed sessions supporting utilization math', 'success')
    ],
    charts: [
      comparisonChart(
        'Utilization by therapist',
        'Compare utilization percentage across therapists.',
        therapistRows.slice(0, 12).map((row) => ({
          label: row.therapist,
          value: Math.round(row.utilization),
          detail: row.location,
          tone: toneFromPercent(row.utilization)
        })),
        'percent'
      ),
      comparisonChart(
        'Open capacity by location',
        'See which locations have room to absorb demand.',
        [...new Set(therapistRows.map((row) => row.location))]
          .sort((left, right) => left.localeCompare(right))
          .map((location) => {
            const rows = therapistRows.filter((row) => row.location === location);
            const openCapacity = rows.reduce((sum, row) => sum + Math.max(0, row.weeklyCapacity - row.completed), 0);
            return {
              label: location,
              value: openCapacity,
              tone: openCapacity >= 30 ? 'success' : openCapacity >= 12 ? 'warning' : 'critical'
            };
          })
      )
    ],
    table: makeTable(
      'Therapist utilization detail',
      'Use this table to compare therapist load, weekly capacity assumptions, and utilization balance.',
      [
        { key: 'therapist', label: 'Therapist' },
        { key: 'location', label: 'Location' },
        { key: 'scheduled', label: 'Scheduled', align: 'right' },
        { key: 'completed', label: 'Completed', align: 'right' },
        { key: 'weeklyCapacity', label: 'Capacity', align: 'right' },
        { key: 'utilization', label: 'Utilization', align: 'right' }
      ],
      therapistRows.map((row) =>
        tableRow(row.therapist, {
          therapist: row.therapist,
          location: row.location,
          scheduled: String(row.scheduled),
          completed: String(row.completed),
          weeklyCapacity: String(row.weeklyCapacity),
          utilization: formatPercent(row.utilization)
        })
      )
    ),
    notes: [
      'Utilization is derived from completed sessions versus an assumed weekly capacity band for the reporting window.',
      'Centralized administration should use this report to find both overload risk and fill opportunities.',
      'Location comparisons help identify where coverage pressure is likely to emerge next.'
    ]
  };
}

function buildSupervisoryOversightReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const expected = data.sessions.filter((session) => session.supervisionExpected);
  const completed = expected.filter((session) => session.supervisionCompleted);
  const lacking = expected.filter((session) => !session.supervisionCompleted);
  const completionRate = expected.length > 0 ? (completed.length / expected.length) * 100 : 0;

  const rows = [...new Set(data.sessions.map((session) => session.supervisingClinicianName))]
    .sort((left, right) => left.localeCompare(right))
    .map((clinician) => {
      const sessions = expected.filter((session) => session.supervisingClinicianName === clinician);
      return tableRow(clinician, {
        supervisingClinician: clinician,
        location: sessions[0]?.locationName ?? 'Clinic',
        supervised: String(sessions.filter((session) => session.supervisionCompleted).length),
        lacking: String(sessions.filter((session) => !session.supervisionCompleted).length),
        completionRate: formatPercent(
          sessions.length > 0
            ? (sessions.filter((session) => session.supervisionCompleted).length / sessions.length) * 100
            : 0
        )
      });
    });

  return {
    reportId: 'supervisory-oversight',
    reportLabel: 'Supervisory Oversight Report',
    description: 'Track supervision coverage, missing oversight, and completion trends by location and clinician.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Supervision data refreshed from mock session oversight history',
    lastRunLabel: 'Built from supervision-expected versus supervision-completed session records',
    recordCount: expected.length,
    metrics: [
      makeMetric('Supervised sessions', String(completed.length), 'Sessions with expected supervision completed', 'success'),
      makeMetric('Lacking oversight', String(lacking.length), 'Sessions missing expected supervision', lacking.length > 70 ? 'critical' : 'warning'),
      makeMetric('Completion trend', formatPercent(completionRate), 'Supervision completion rate across selected sessions', toneFromPercent(completionRate)),
      makeMetric('Supervising clinicians', String(rows.length), 'Supervisors represented in the filtered result set', 'info')
    ],
    charts: [
      trendChart(
        'Supervision completion by month',
        'Monthly supervised-session count.',
        monthlySeries(completed, (session) => session.date, (items) => items.length).map((entry) => ({
          ...entry,
          tone: 'success' as ProviderReportTone
        }))
      ),
      comparisonChart(
        'Oversight gaps by supervising clinician',
        'Identify where supervision completion is slipping.',
        rows.map((row) => ({
          label: row.values.supervisingClinician,
          value: Number(row.values.lacking),
          detail: row.values.location,
          tone: Number(row.values.lacking) > 20 ? 'critical' : 'warning'
        }))
      )
    ],
    table: makeTable(
      'Supervision by clinician',
      'Use this table to compare supervision completion across clinicians and locations.',
      [
        { key: 'supervisingClinician', label: 'Supervising clinician' },
        { key: 'location', label: 'Location' },
        { key: 'supervised', label: 'Supervised sessions', align: 'right' },
        { key: 'lacking', label: 'Lacking supervision', align: 'right' },
        { key: 'completionRate', label: 'Completion rate', align: 'right' }
      ],
      rows
    ),
    notes: [
      'Supervision completion is especially important for centralized quality oversight and staffing alignment.',
      'This report uses a mock expectation model based on patient type and session profile.',
      'Location and supervising-clinician filters are especially useful for follow-up review.'
    ]
  };
}

function buildLocationPerformanceReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const locationRows = [...new Set(data.patients.map((patient) => patient.primaryLocationName))]
    .sort((left, right) => left.localeCompare(right))
    .map((location) => {
      const patients = data.patients.filter((patient) => patient.primaryLocationName === location);
      const sessions = data.sessions.filter((session) => session.locationName === location);
      const claims = data.claims.filter((claim) => claim.locationName === location);
      const auths = data.authorizations.filter((auth) => auth.locationName === location);
      const completed = sessions.filter((session) => session.sessionStatus === 'completed').length;
      const cancellations = sessions.filter((session) => session.sessionStatus === 'cancelled' || session.sessionStatus === 'no_show').length;
      const denialRate = claims.length > 0 ? (claims.filter((claim) => claim.status === 'denied').length / claims.length) * 100 : 0;
      const authRisk = auths.filter((auth) => auth.status === 'low_remaining' || auth.status === 'expiring_soon').length;

      return {
        location,
        census: patients.filter((patient) => patient.status === 'active').length,
        completed,
        cancellationRate: sessions.length > 0 ? (cancellations / sessions.length) * 100 : 0,
        denialRate,
        revenue: claims.reduce((sum, claim) => sum + claim.amountPaid, 0),
        authRisk,
        utilization: sessions.length > 0 ? (completed / Math.max(1, sessions.length)) * 100 : 0
      };
    });

  return {
    reportId: 'location-performance',
    reportLabel: 'Location Performance Summary',
    description: 'Compare census, delivery, denial rate, revenue, authorization risk, and utilization by location.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Location summary generated from the mock operating warehouse',
    lastRunLabel: 'Rolled up from patient, session, authorization, and claims history',
    recordCount: locationRows.length,
    metrics: [
      makeMetric('Locations compared', String(locationRows.length), 'Operating locations in the selected result set', 'info'),
      makeMetric('Average cancellation rate', formatPercent(locationRows.reduce((sum, row) => sum + row.cancellationRate, 0) / Math.max(locationRows.length, 1)), 'Average cancelled or no-show rate by location', 'warning'),
      makeMetric('Average denial rate', formatPercent(locationRows.reduce((sum, row) => sum + row.denialRate, 0) / Math.max(locationRows.length, 1)), 'Average claims denial rate by location', 'warning'),
      makeMetric('Paid revenue', formatCurrency(locationRows.reduce((sum, row) => sum + row.revenue, 0)), 'Paid dollars posted across filtered locations', 'success')
    ],
    charts: [
      comparisonChart(
        'Completed sessions by location',
        'See which locations are carrying the most delivery volume.',
        locationRows.map((row) => ({
          label: row.location,
          value: row.completed,
          detail: `${row.census} active patients`,
          tone: 'info' as ProviderReportTone
        }))
      ),
      comparisonChart(
        'Authorization risk by location',
        'Locations with the highest combined auth pressure.',
        locationRows.map((row) => ({
          label: row.location,
          value: row.authRisk,
          detail: `${formatPercent(row.denialRate)} denial rate`,
          tone: row.authRisk > 45 ? 'critical' : row.authRisk > 25 ? 'warning' : 'success'
        }))
      )
    ],
    table: makeTable(
      'Location performance summary',
      'Compare operational and business performance across clinic/service locations.',
      [
        { key: 'location', label: 'Location' },
        { key: 'census', label: 'Active census', align: 'right' },
        { key: 'completed', label: 'Sessions completed', align: 'right' },
        { key: 'cancellationRate', label: 'Cancellation rate', align: 'right' },
        { key: 'denialRate', label: 'Denial rate', align: 'right' },
        { key: 'revenue', label: 'Paid revenue', align: 'right' },
        { key: 'authRisk', label: 'Auth risk', align: 'right' }
      ],
      locationRows.map((row) =>
        tableRow(row.location, {
          location: row.location,
          census: String(row.census),
          completed: String(row.completed),
          cancellationRate: formatPercent(row.cancellationRate),
          denialRate: formatPercent(row.denialRate),
          revenue: formatCurrency(row.revenue),
          authRisk: String(row.authRisk)
        })
      )
    ),
    notes: [
      'Use this report to compare clinic and home-team performance side by side for centralized administration.',
      'Authorization risk is the count of low-remaining and expiring authorizations tied to the location.',
      'Location summaries are designed to be business-friendly and do not expose warehouse table names or query internals.'
    ]
  };
}

function buildExecutiveSummaryReport(filters: ProviderReportingFilters, data: FilteredWarehouse): ProviderReportView {
  const activePatients = data.patients.filter((patient) => patient.status === 'active').length;
  const completedSessions = data.sessions.filter((session) => session.sessionStatus === 'completed').length;
  const cancellationRate =
    data.sessions.length > 0
      ? (data.sessions.filter((session) => session.sessionStatus === 'cancelled' || session.sessionStatus === 'no_show').length / data.sessions.length) * 100
      : 0;
  const deniedClaims = data.claims.filter((claim) => claim.status === 'denied').length;
  const billedAmount = data.claims.reduce((sum, claim) => sum + claim.amountBilled, 0);
  const paidAmount = data.claims.reduce((sum, claim) => sum + claim.amountPaid, 0);
  const highRiskAuths = data.authorizations.filter((auth) => auth.status === 'low_remaining' || auth.status === 'expiring_soon').length;
  const therapistSummary = buildTherapistUtilizationReport(filters, data);
  const locationSummary = buildLocationPerformanceReport(filters, data);

  return {
    reportId: 'executive-business-summary',
    reportLabel: 'Executive Business Summary',
    description: 'Top-line business view for centralized ABA clinic administration with operational, staffing, authorization, and revenue rollups.',
    appliedFiltersLabel: buildAppliedFiltersLabel(filters),
    dataFreshnessLabel: 'Executive rollup built from the mock provider reporting warehouse',
    lastRunLabel: 'Summarized from two years of ABA clinic operating history',
    recordCount: data.patients.length + data.sessions.length + data.claims.length,
    metrics: [
      makeMetric('Active census', String(activePatients), 'Current active patients in the selected filters', 'success'),
      makeMetric('Sessions delivered', String(completedSessions), 'Completed sessions in the selected period', 'info'),
      makeMetric('Cancellation / no-show rate', formatPercent(cancellationRate), 'Combined session disruption rate', cancellationRate > 18 ? 'critical' : cancellationRate > 11 ? 'warning' : 'success'),
      makeMetric('Revenue paid', formatCurrency(paidAmount), `${formatCurrency(billedAmount)} billed · ${deniedClaims} denied`, 'success')
    ],
    charts: [
      comparisonChart(
        'Executive KPI comparison',
        'The key numbers most likely to change staffing, authorization, or billing priorities.',
        [
          { label: 'Active patients', value: activePatients, tone: 'success' as ProviderReportTone },
          { label: 'Completed sessions', value: completedSessions, tone: 'info' as ProviderReportTone },
          { label: 'Denied claims', value: deniedClaims, tone: deniedClaims > 140 ? 'critical' as ProviderReportTone : 'warning' as ProviderReportTone },
          { label: 'High-risk auths', value: highRiskAuths, tone: highRiskAuths > 60 ? 'critical' as ProviderReportTone : 'warning' as ProviderReportTone }
        ]
      ),
      comparisonChart(
        'Location comparison snapshot',
        'See which locations are strongest and which need support.',
        locationSummary.table.rows.map((row) => ({
          label: row.values.location,
          value: Number(row.values.completed),
          detail: row.values.denialRate,
          tone: 'info' as ProviderReportTone
        }))
      )
    ],
    table: makeTable(
      'Executive location summary',
      'A compact business summary by location for centralized administration.',
      locationSummary.table.columns,
      locationSummary.table.rows
    ),
    notes: [
      `Average therapist utilization is ${therapistSummary.metrics[0]?.value ?? '0%'} in the selected view.`,
      `${highRiskAuths} high-risk authorizations and ${deniedClaims} denied claims need monitoring from centralized operations.`,
      'This report is meant to tell the clinic story quickly, then send leaders into more detailed canned reports.'
    ]
  };
}

export function getProviderReportingStaticOptionsFromWarehouse() {
  const warehouse = getProviderReportingWarehouse();

  return buildProviderReportingStaticOptions({
    locations: uniqueOptions(warehouse.locations.map((location) => location.name)),
    patientTypes: uniqueOptions(warehouse.patients.map((patient) => patient.patientType)),
    payers: uniqueOptions(warehouse.patients.map((patient) => patient.payer)),
    therapists: uniqueOptions(
      warehouse.staff.filter((record) => record.role === 'therapist').map((record) => record.name)
    ),
    supervisingClinicians: uniqueOptions(
      warehouse.staff
        .filter((record) => record.role === 'supervising_clinician')
        .map((record) => record.name)
    ),
    statuses: uniqueOptions(['active', 'discharged', 'inactive', 'completed', 'cancelled', 'no_show', 'scheduled', 'verified', 'unverified', 'failed']),
    authorizationStatuses: uniqueOptions(['active', 'expiring_soon', 'low_remaining', 'expired', 'pending']),
    claimStatuses: uniqueOptions(['submitted', 'paid', 'denied', 'pending', 'resubmitted']),
    denialReasons: uniqueOptions(['authorization', 'eligibility', 'coding', 'documentation']),
    serviceSettings: uniqueOptions(['clinic', 'home', 'school'])
  });
}

export function getProviderReportingWarehouseSummary() {
  return getProviderReportingWarehouse().summary;
}

export function runProviderReport(filters: ProviderReportingFilters): ProviderReportView {
  const warehouse = getProviderReportingWarehouse();
  const data = filterWarehouse(warehouse, filters);

  switch (filters.reportId) {
    case 'patient-census':
      return buildPatientCensusReport(filters, data);
    case 'sessions-delivered':
      return buildSessionsDeliveredReport(filters, data);
    case 'authorization-utilization':
      return buildAuthorizationUtilizationReport(filters, data);
    case 'eligibility-readiness':
      return buildEligibilityReadinessReport(filters, data);
    case 'claims-revenue':
      return buildClaimsRevenueReport(filters, data);
    case 'denials-resubmissions':
      return buildDenialsResubmissionsReport(filters, data);
    case 'therapist-utilization':
      return buildTherapistUtilizationReport(filters, data);
    case 'supervisory-oversight':
      return buildSupervisoryOversightReport(filters, data);
    case 'location-performance':
      return buildLocationPerformanceReport(filters, data);
    case 'executive-business-summary':
    default:
      return buildExecutiveSummaryReport(filters, data);
  }
}
