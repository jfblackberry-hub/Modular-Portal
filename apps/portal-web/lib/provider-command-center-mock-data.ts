import type {
  ProviderOperationsAttentionItem,
  ProviderOperationsAuthorizationRecord,
  ProviderOperationsAuthorizationsSection,
  ProviderOperationsClaimRecord,
  ProviderOperationsClaimStatus,
  ProviderOperationsClaimsPipelineMetric,
  ProviderOperationsClaimsSection,
  ProviderOperationsDashboardContract,
  ProviderOperationsDenialReasonMetric,
  ProviderOperationsOrganizationUnitOption,
  ProviderOperationsQuickAction,
  ProviderOperationsSchedulingSection,
  ProviderOperationsSessionRecord,
  ProviderOperationsSummaryMetric,
  ProviderOperationsUrgency,
  ProviderOperationsUtilizationRecord,
  ProviderOperationsUtilizationSection,
  ProviderOperationsWidgetContract,
  ProviderOperationsWidgetId,
  ProviderOperationsWidgetTone
} from '@payer-portal/api-contracts';

import type { PortalSessionUser } from './portal-session';

type BaseSession = Omit<ProviderOperationsSessionRecord, 'status' | 'issueFlags' | 'nextAction'> & {
  baseStatus: ProviderOperationsSessionRecord['status'];
  issueFlags: string[];
};

type BaseAuthorization = ProviderOperationsAuthorizationRecord;
type BaseClaim = ProviderOperationsClaimRecord;
type BaseUtilization = ProviderOperationsUtilizationRecord;

const REFRESH_INTERVAL_SECONDS = 30;

const QUICK_ACTIONS: ProviderOperationsQuickAction[] = [
  {
    id: 'eligibility_check',
    label: 'Start Eligibility Check',
    description: 'Verify coverage before a session starts slipping.',
    href: '/provider/dashboard?detail=scheduling&filter=eligibility_missing'
  },
  {
    id: 'create_authorization',
    label: 'Create Authorization',
    description: 'Open new auth work for a child with upcoming sessions.',
    href: '/provider/dashboard?detail=authorizations&filter=pending'
  },
  {
    id: 'submit_claim',
    label: 'Submit Claim',
    description: 'Move ready visit data into the claims pipeline.',
    href: '/provider/dashboard?detail=claims&filter=submitted'
  },
  {
    id: 'check_claim_status',
    label: 'Check Claim Status',
    description: 'Review denials, resubmissions, and what needs work now.',
    href: '/provider/dashboard?detail=claims&filter=denied'
  }
];

const BASE_SESSIONS: BaseSession[] = [
  {
    id: 'sess-001',
    organizationUnitId: 'ou-clinic',
    organizationUnitName: 'Grand Rapids Clinic',
    setting: 'clinic',
    patientName: 'Milo Anderson',
    caseName: 'Early learner program',
    therapistName: 'Avery Collins',
    supervisingClinicianName: 'Dr. Priya Shah, BCBA',
    startTime: '08:00 AM',
    endTime: '10:00 AM',
    baseStatus: 'ready',
    issueFlags: []
  },
  {
    id: 'sess-002',
    organizationUnitId: 'ou-home',
    organizationUnitName: 'Kent Home Services',
    setting: 'home',
    patientName: 'Noah Bennett',
    caseName: 'Home-based parent training',
    therapistName: 'Jasmine Flores',
    supervisingClinicianName: 'Lauren Price, BCBA',
    startTime: '09:30 AM',
    endTime: '11:30 AM',
    baseStatus: 'at_risk',
    issueFlags: ['Eligibility not rechecked for today', 'Parent confirmation missing']
  },
  {
    id: 'sess-003',
    organizationUnitId: 'ou-clinic',
    organizationUnitName: 'Grand Rapids Clinic',
    setting: 'clinic',
    patientName: 'Sofia Ramirez',
    caseName: 'Social communication block',
    therapistName: 'Evan Mitchell',
    supervisingClinicianName: 'Dr. Priya Shah, BCBA',
    startTime: '11:00 AM',
    endTime: '01:00 PM',
    baseStatus: 'documentation_needed',
    issueFlags: ['Previous note unsigned', 'Overlap with supervision plan review']
  },
  {
    id: 'sess-004',
    organizationUnitId: 'ou-school',
    organizationUnitName: 'Lakeshore School Services',
    setting: 'school',
    patientName: 'Liam Carter',
    caseName: 'School support program',
    therapistName: 'Open coverage',
    supervisingClinicianName: 'Mara Thompson, BCBA',
    startTime: '01:30 PM',
    endTime: '03:00 PM',
    baseStatus: 'open_slot',
    issueFlags: ['RBT cancellation at 7:12 AM', 'No coverage assigned yet']
  },
  {
    id: 'sess-005',
    organizationUnitId: 'ou-home',
    organizationUnitName: 'Kent Home Services',
    setting: 'home',
    patientName: 'Ella Brooks',
    caseName: 'Feeding support follow-up',
    therapistName: 'Marcus Reed',
    supervisingClinicianName: 'Lauren Price, BCBA',
    startTime: '03:30 PM',
    endTime: '05:30 PM',
    baseStatus: 'confirmed',
    issueFlags: ['Authorization drops below threshold after today']
  },
  {
    id: 'sess-006',
    organizationUnitId: 'ou-clinic',
    organizationUnitName: 'Grand Rapids Clinic',
    setting: 'clinic',
    patientName: 'Caleb Turner',
    caseName: 'Adolescent transition planning',
    therapistName: 'Taylor Brooks',
    supervisingClinicianName: 'Dr. Priya Shah, BCBA',
    startTime: '04:00 PM',
    endTime: '06:00 PM',
    baseStatus: 'ready',
    issueFlags: []
  }
];

const BASE_AUTHORIZATIONS: BaseAuthorization[] = [
  {
    id: 'auth-101',
    organizationUnitId: 'ou-clinic',
    organizationUnitName: 'Grand Rapids Clinic',
    patientName: 'Milo Anderson',
    caseName: 'Early learner program',
    payerName: 'Blue Horizon Health',
    therapistName: 'Avery Collins',
    supervisingClinicianName: 'Dr. Priya Shah, BCBA',
    status: 'active',
    startDate: '2026-02-01',
    endDate: '2026-04-15',
    remainingVisits: 18,
    upcomingScheduledSessions: 8,
    followUpStatus: 'In good standing',
    noteCount: 3,
    documentCount: 2,
    nextAction: 'Monitor weekly utilization'
  },
  {
    id: 'auth-102',
    organizationUnitId: 'ou-home',
    organizationUnitName: 'Kent Home Services',
    patientName: 'Noah Bennett',
    caseName: 'Home-based parent training',
    payerName: 'Aetna Better Health',
    therapistName: 'Jasmine Flores',
    supervisingClinicianName: 'Lauren Price, BCBA',
    status: 'due_soon',
    startDate: '2026-01-10',
    endDate: '2026-03-29',
    remainingVisits: 4,
    upcomingScheduledSessions: 5,
    followUpStatus: 'Clinical update needed before Friday',
    noteCount: 5,
    documentCount: 4,
    nextAction: 'Extend auth before Thursday'
  },
  {
    id: 'auth-103',
    organizationUnitId: 'ou-school',
    organizationUnitName: 'Lakeshore School Services',
    patientName: 'Liam Carter',
    caseName: 'School support program',
    payerName: 'Meridian Medicaid',
    therapistName: 'Open coverage',
    supervisingClinicianName: 'Mara Thompson, BCBA',
    status: 'expired',
    startDate: '2025-12-15',
    endDate: '2026-03-24',
    remainingVisits: 0,
    upcomingScheduledSessions: 3,
    followUpStatus: 'Future sessions scheduled past auth end date',
    noteCount: 2,
    documentCount: 1,
    nextAction: 'Inspect impacted future sessions'
  },
  {
    id: 'auth-104',
    organizationUnitId: 'ou-clinic',
    organizationUnitName: 'Grand Rapids Clinic',
    patientName: 'Sofia Ramirez',
    caseName: 'Social communication block',
    payerName: 'Blue Care Network',
    therapistName: 'Evan Mitchell',
    supervisingClinicianName: 'Dr. Priya Shah, BCBA',
    status: 'low_visits',
    startDate: '2026-02-14',
    endDate: '2026-05-01',
    remainingVisits: 3,
    upcomingScheduledSessions: 4,
    followUpStatus: 'Only one week of visits remaining',
    noteCount: 4,
    documentCount: 3,
    nextAction: 'Upload updated treatment plan'
  },
  {
    id: 'auth-105',
    organizationUnitId: 'ou-home',
    organizationUnitName: 'Kent Home Services',
    patientName: 'Ella Brooks',
    caseName: 'Feeding support follow-up',
    payerName: 'Priority Health',
    therapistName: 'Marcus Reed',
    supervisingClinicianName: 'Lauren Price, BCBA',
    status: 'pending',
    startDate: '2026-03-21',
    endDate: '2026-06-30',
    remainingVisits: 0,
    upcomingScheduledSessions: 2,
    followUpStatus: 'Pending payer intake confirmation',
    noteCount: 2,
    documentCount: 2,
    nextAction: 'Call payer for receipt confirmation'
  }
];

const BASE_UTILIZATION: BaseUtilization[] = [
  {
    id: 'util-1',
    organizationUnitId: 'ou-clinic',
    organizationUnitName: 'Grand Rapids Clinic',
    therapistName: 'Avery Collins',
    roleLabel: 'Therapist',
    utilizationPercent: 88,
    scheduledSessions: 7,
    weeklyCapacity: 8,
    openCoverageGaps: 0,
    atRiskSessions: 0,
    tone: 'success',
    nextAction: 'Maintain current pacing'
  },
  {
    id: 'util-2',
    organizationUnitId: 'ou-home',
    organizationUnitName: 'Kent Home Services',
    therapistName: 'Jasmine Flores',
    roleLabel: 'Therapist',
    utilizationPercent: 96,
    scheduledSessions: 8,
    weeklyCapacity: 8,
    openCoverageGaps: 0,
    atRiskSessions: 2,
    tone: 'warning',
    nextAction: 'Reduce overload before Friday'
  },
  {
    id: 'util-3',
    organizationUnitId: 'ou-school',
    organizationUnitName: 'Lakeshore School Services',
    therapistName: 'Coverage pool',
    roleLabel: 'Coverage team',
    utilizationPercent: 61,
    scheduledSessions: 5,
    weeklyCapacity: 8,
    openCoverageGaps: 2,
    atRiskSessions: 1,
    tone: 'info',
    nextAction: 'Identify fill opportunities'
  },
  {
    id: 'util-4',
    organizationUnitId: 'ou-clinic',
    organizationUnitName: 'Grand Rapids Clinic',
    therapistName: 'Taylor Brooks',
    roleLabel: 'Therapist',
    utilizationPercent: 104,
    scheduledSessions: 9,
    weeklyCapacity: 8,
    openCoverageGaps: 0,
    atRiskSessions: 1,
    tone: 'danger',
    nextAction: 'Rebalance today'
  }
];

const BASE_CLAIMS: BaseClaim[] = [
  {
    id: 'clm-7001',
    organizationUnitId: 'ou-clinic',
    organizationUnitName: 'Grand Rapids Clinic',
    patientName: 'Milo Anderson',
    caseName: 'Early learner program',
    therapistName: 'Avery Collins',
    dateOfService: '2026-03-24',
    amount: 1180,
    payerName: 'Blue Horizon Health',
    status: 'submitted',
    denialReason: null,
    nextAction: 'Monitor acceptance',
    resubmissionStatus: null,
    ageInDays: 2
  },
  {
    id: 'clm-7002',
    organizationUnitId: 'ou-home',
    organizationUnitName: 'Kent Home Services',
    patientName: 'Noah Bennett',
    caseName: 'Home-based parent training',
    therapistName: 'Jasmine Flores',
    dateOfService: '2026-03-23',
    amount: 960,
    payerName: 'Aetna Better Health',
    status: 'denied',
    denialReason: 'Authorization expired',
    nextAction: 'Correct auth linkage and resubmit',
    resubmissionStatus: 'Correction needed',
    ageInDays: 3
  },
  {
    id: 'clm-7003',
    organizationUnitId: 'ou-clinic',
    organizationUnitName: 'Grand Rapids Clinic',
    patientName: 'Sofia Ramirez',
    caseName: 'Social communication block',
    therapistName: 'Evan Mitchell',
    dateOfService: '2026-03-22',
    amount: 840,
    payerName: 'Blue Care Network',
    status: 'pending_resubmission',
    denialReason: 'Session note incomplete',
    nextAction: 'Finish note and attach supervision record',
    resubmissionStatus: 'Awaiting clinical documentation',
    ageInDays: 4
  },
  {
    id: 'clm-7004',
    organizationUnitId: 'ou-school',
    organizationUnitName: 'Lakeshore School Services',
    patientName: 'Liam Carter',
    caseName: 'School support program',
    therapistName: 'Coverage pool',
    dateOfService: '2026-03-21',
    amount: 720,
    payerName: 'Meridian Medicaid',
    status: 'in_review',
    denialReason: null,
    nextAction: 'Watch payer review timeline',
    resubmissionStatus: null,
    ageInDays: 5
  },
  {
    id: 'clm-7005',
    organizationUnitId: 'ou-home',
    organizationUnitName: 'Kent Home Services',
    patientName: 'Ella Brooks',
    caseName: 'Feeding support follow-up',
    therapistName: 'Marcus Reed',
    dateOfService: '2026-03-20',
    amount: 680,
    payerName: 'Priority Health',
    status: 'paid',
    denialReason: null,
    nextAction: 'Close payment follow-up',
    resubmissionStatus: null,
    ageInDays: 6
  }
];

function minuteBucket(now: Date) {
  return Math.floor(now.getTime() / (REFRESH_INTERVAL_SECONDS * 1000));
}

function cloneSessions(cycleIndex: number) {
  return BASE_SESSIONS.map((session) => {
    const next = {
      ...session,
      status: session.baseStatus,
      issueFlags: [...session.issueFlags],
      nextAction: 'Review session'
    } satisfies ProviderOperationsSessionRecord;

    if (next.id === 'sess-002') {
      next.nextAction = 'Trigger eligibility check';
    }

    if (next.id === 'sess-003') {
      next.nextAction = 'Resolve documentation readiness';
    }

    if (next.id === 'sess-004') {
      next.nextAction = 'Fill open slot';
    }

    if (next.id === 'sess-005') {
      next.nextAction = 'Inspect auth risk';
    }

    if (cycleIndex % 3 === 1 && next.id === 'sess-001') {
      next.status = 'at_risk';
      next.issueFlags = [
        ...next.issueFlags,
        'Supervising clinician running late for protocol review'
      ];
      next.nextAction = 'Confirm supervision coverage';
    }

    if (cycleIndex % 4 === 2 && next.id === 'sess-004') {
      next.issueFlags = [
        'Morning cancellation created a new afternoon gap',
        'Family requested same-day replacement'
      ];
    }

    if (cycleIndex % 5 === 3 && next.id === 'sess-006') {
      next.status = 'documentation_needed';
      next.issueFlags = [
        'Progress note still unsigned',
        'Claim hold risk if documentation stays incomplete'
      ];
      next.nextAction = 'Resolve note before end of day';
    }

    return next;
  });
}

function cloneAuthorizations(cycleIndex: number) {
  return BASE_AUTHORIZATIONS.map((authorization) => {
    const next = { ...authorization };

    if (cycleIndex % 4 === 1 && next.id === 'auth-102') {
      next.status = 'low_visits';
      next.remainingVisits = 2;
      next.followUpStatus = 'Only two visits remain against scheduled week';
      next.nextAction = 'Escalate low remaining visits';
    }

    if (cycleIndex % 3 === 2 && next.id === 'auth-105') {
      next.status = 'due_soon';
      next.remainingVisits = 1;
      next.followUpStatus = 'Payer requested updated intake summary';
      next.nextAction = 'Upload updated treatment summary';
    }

    return next;
  });
}

function cloneClaims(cycleIndex: number) {
  return BASE_CLAIMS.map((claim) => {
    const next = { ...claim };

    if (cycleIndex % 4 === 1 && next.id === 'clm-7001') {
      next.status = 'adjudicated';
      next.nextAction = 'Post remittance when available';
    }

    if (cycleIndex % 4 === 2 && next.id === 'clm-7004') {
      next.status = 'denied';
      next.denialReason = 'Eligibility mismatch';
      next.nextAction = 'Confirm eligibility and correct claim';
      next.resubmissionStatus = 'New denial today';
    }

    if (cycleIndex % 4 === 3 && next.id === 'clm-7003') {
      next.status = 'resubmitted';
      next.nextAction = 'Watch corrected claim acceptance';
      next.resubmissionStatus = 'Resubmitted 18 minutes ago';
    }

    return next;
  });
}

function cloneUtilization(cycleIndex: number) {
  return BASE_UTILIZATION.map((record) => {
    const next = { ...record };

    if (cycleIndex % 4 === 1 && next.id === 'util-2') {
      next.utilizationPercent = 99;
      next.atRiskSessions = 3;
      next.nextAction = 'Move one late-day home session';
    }

    if (cycleIndex % 5 === 2 && next.id === 'util-3') {
      next.utilizationPercent = 55;
      next.openCoverageGaps = 3;
      next.nextAction = 'Pull from clinic float coverage';
    }

    if (cycleIndex % 3 === 2 && next.id === 'util-4') {
      next.utilizationPercent = 108;
      next.atRiskSessions = 2;
      next.nextAction = 'Reassign one supervision block';
    }

    return next;
  });
}

function filterByScope<T extends { organizationUnitId: string }>(
  records: T[],
  user: PortalSessionUser,
  rollupAuthorized: boolean
) {
  if (rollupAuthorized) {
    return records.filter((record) =>
      user.session.availableOrganizationUnits.some(
        (organizationUnit) => organizationUnit.id === record.organizationUnitId
      )
    );
  }

  const activeOrganizationUnitId = user.session.activeOrganizationUnit?.id;
  if (!activeOrganizationUnitId) {
    return records;
  }

  return records.filter(
    (record) => record.organizationUnitId === activeOrganizationUnitId
  );
}

function buildSchedulingMetrics(sessions: ProviderOperationsSessionRecord[]) {
  const totalSessions = sessions.filter((session) => session.status !== 'open_slot').length;
  const openSlots = sessions.filter((session) => session.status === 'open_slot').length;
  const cancellations = sessions.filter((session) =>
    session.issueFlags.some((flag) => flag.toLowerCase().includes('cancellation'))
  ).length;
  const atRisk = sessions.filter((session) =>
    session.status === 'at_risk' ||
    session.issueFlags.some((flag) => /eligibility|auth|unsigned|coverage/i.test(flag))
  ).length;
  const overloaded = sessions.filter((session) =>
    session.issueFlags.some((flag) => /overlap|coverage/i.test(flag))
  ).length;

  return [
    {
      id: 'sessions_today',
      label: 'Sessions today',
      value: String(totalSessions),
      detail: 'Scheduled ABA sessions for the current day.',
      tone: 'info',
      href: '/provider/dashboard?detail=scheduling&filter=all'
    },
    {
      id: 'open_slots',
      label: 'Open slots',
      value: String(openSlots),
      detail: 'Coverage gaps that central office staff need to fill.',
      tone: openSlots > 0 ? 'danger' : 'success',
      href: '/provider/dashboard?detail=scheduling&filter=open_slot'
    },
    {
      id: 'cancellations',
      label: 'Cancellations',
      value: String(cancellations),
      detail: 'Last-minute changes impacting today’s session plan.',
      tone: cancellations > 0 ? 'warning' : 'success',
      href: '/provider/dashboard?detail=scheduling&filter=cancellations'
    },
    {
      id: 'sessions_at_risk',
      label: 'Sessions at risk',
      value: String(atRisk + overloaded),
      detail: 'Sessions with staffing, readiness, auth, or eligibility issues.',
      tone: atRisk + overloaded > 0 ? 'danger' : 'success',
      href: '/provider/dashboard?detail=scheduling&filter=at_risk'
    }
  ] satisfies ProviderOperationsSummaryMetric[];
}

function buildAuthorizationMetrics(
  authorizations: ProviderOperationsAuthorizationRecord[]
) {
  const active = authorizations.filter((authorization) => authorization.status === 'active').length;
  const dueSoon = authorizations.filter((authorization) =>
    authorization.status === 'due_soon' || authorization.status === 'low_visits'
  ).length;
  const pending = authorizations.filter((authorization) => authorization.status === 'pending').length;
  const denied = authorizations.filter((authorization) => authorization.status === 'denied').length;
  const lowVisits = authorizations.filter((authorization) =>
    authorization.remainingVisits <= 4
  ).length;

  return [
    {
      id: 'active_auths',
      label: 'Active auths',
      value: String(active),
      detail: 'Authorizations in good standing.',
      tone: 'success',
      href: '/provider/dashboard?detail=authorizations&filter=active'
    },
    {
      id: 'due_this_week',
      label: 'Due this week',
      value: String(dueSoon),
      detail: 'Expiring soon or running low before the week closes.',
      tone: dueSoon > 0 ? 'warning' : 'success',
      href: '/provider/dashboard?detail=authorizations&filter=due_soon'
    },
    {
      id: 'pending_auths',
      label: 'Pending auths',
      value: String(pending),
      detail: 'Requests still waiting on payer action.',
      tone: pending > 0 ? 'info' : 'success',
      href: '/provider/dashboard?detail=authorizations&filter=pending'
    },
    {
      id: 'low_remaining',
      label: 'Low visits',
      value: String(lowVisits),
      detail: 'Cases where remaining authorized visits are about to run out.',
      tone: lowVisits > 0 ? 'danger' : 'success',
      href: '/provider/dashboard?detail=authorizations&filter=low_visits'
    },
    {
      id: 'denied_auths',
      label: 'Denied auths',
      value: String(denied),
      detail: 'Authorizations needing rework or appeal.',
      tone: denied > 0 ? 'danger' : 'success',
      href: '/provider/dashboard?detail=authorizations&filter=denied'
    }
  ] satisfies ProviderOperationsSummaryMetric[];
}

function buildUtilizationMetrics(records: ProviderOperationsUtilizationRecord[]) {
  const averageUtilization = Math.round(
    records.reduce((sum, record) => sum + record.utilizationPercent, 0) / Math.max(records.length, 1)
  );
  const underutilized = records.filter((record) => record.utilizationPercent < 70).length;
  const overloaded = records.filter((record) => record.utilizationPercent > 95).length;
  const coverageGaps = records.reduce((sum, record) => sum + record.openCoverageGaps, 0);

  return [
    {
      id: 'avg_utilization',
      label: 'Average utilization',
      value: `${averageUtilization}%`,
      detail: 'Scheduled ABA sessions against weekly therapist capacity.',
      tone: averageUtilization >= 80 ? 'success' : 'warning',
      href: '/provider/dashboard?detail=utilization&filter=all'
    },
    {
      id: 'underutilized',
      label: 'Underutilized therapists',
      value: String(underutilized),
      detail: 'Therapists with fill capacity this week.',
      tone: underutilized > 0 ? 'info' : 'success',
      href: '/provider/dashboard?detail=utilization&filter=underutilized'
    },
    {
      id: 'overloaded',
      label: 'Overloaded therapists',
      value: String(overloaded),
      detail: 'Schedules likely to create call-outs or missed supervision coverage.',
      tone: overloaded > 0 ? 'danger' : 'success',
      href: '/provider/dashboard?detail=utilization&filter=overloaded'
    },
    {
      id: 'coverage_gaps',
      label: 'Coverage gaps',
      value: String(coverageGaps),
      detail: 'Open opportunities to rebalance sessions or pull float coverage.',
      tone: coverageGaps > 0 ? 'warning' : 'success',
      href: '/provider/dashboard?detail=utilization&filter=coverage_gaps'
    }
  ] satisfies ProviderOperationsSummaryMetric[];
}

function buildClaimsMetrics(claims: ProviderOperationsClaimRecord[]) {
  const submittedToday = claims.filter((claim) => claim.status === 'submitted').length;
  const pending = claims.filter((claim) =>
    claim.status === 'submitted' || claim.status === 'in_review'
  ).length;
  const denied = claims.filter((claim) => claim.status === 'denied').length;
  const resubmission = claims.filter((claim) =>
    claim.status === 'pending_resubmission' || claim.status === 'resubmitted'
  ).length;
  const amountAtRisk = claims
    .filter((claim) => claim.status === 'denied' || claim.status === 'pending_resubmission')
    .reduce((sum, claim) => sum + claim.amount, 0);

  return [
    {
      id: 'submitted_today',
      label: 'Submitted today',
      value: String(submittedToday),
      detail: 'Claims entering the pipeline from recent session delivery.',
      tone: 'info',
      href: '/provider/dashboard?detail=claims&filter=submitted'
    },
    {
      id: 'claims_pending',
      label: 'Claims pending',
      value: String(pending),
      detail: 'Claims still in submitted or payer review states.',
      tone: pending > 0 ? 'warning' : 'success',
      href: '/provider/dashboard?detail=claims&filter=pending'
    },
    {
      id: 'denied_today',
      label: 'Denied today',
      value: String(denied),
      detail: 'New denials needing correction or resubmission.',
      tone: denied > 0 ? 'danger' : 'success',
      href: '/provider/dashboard?detail=claims&filter=denied'
    },
    {
      id: 'resubmissions_pending',
      label: 'Resubmissions pending',
      value: String(resubmission),
      detail: 'Claims in correction or resubmission workflow.',
      tone: resubmission > 0 ? 'warning' : 'success',
      href: '/provider/dashboard?detail=claims&filter=resubmission'
    },
    {
      id: 'amount_at_risk',
      label: 'Dollar amount at risk',
      value: `$${amountAtRisk.toLocaleString()}`,
      detail: 'Revenue tied to denied or not-yet-corrected ABA claims.',
      tone: amountAtRisk > 0 ? 'danger' : 'success',
      href: '/provider/dashboard?detail=claims&filter=at_risk'
    }
  ] satisfies ProviderOperationsSummaryMetric[];
}

function buildPipeline(claims: ProviderOperationsClaimRecord[]) {
  const ordered: Array<{ status: ProviderOperationsClaimStatus; label: string }> = [
    { status: 'submitted', label: 'Submitted' },
    { status: 'in_review', label: 'In review' },
    { status: 'adjudicated', label: 'Adjudicated' },
    { status: 'paid', label: 'Paid' },
    { status: 'denied', label: 'Denied' },
    { status: 'resubmitted', label: 'Resubmitted' },
    { status: 'pending_resubmission', label: 'Pending resubmission' }
  ];

  return ordered.map((entry) => ({
    ...entry,
    count: claims.filter((claim) => claim.status === entry.status).length
  })) satisfies ProviderOperationsClaimsPipelineMetric[];
}

function buildDenialReasons(claims: ProviderOperationsClaimRecord[]) {
  const denialClaims = claims.filter((claim) => claim.denialReason);
  const groups = new Map<string, { count: number; amountAtRisk: number }>();

  for (const claim of denialClaims) {
    const key = claim.denialReason ?? 'Unknown';
    const current = groups.get(key) ?? { count: 0, amountAtRisk: 0 };
    current.count += 1;
    current.amountAtRisk += claim.amount;
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([reason, value]) => ({
    reason,
    count: value.count,
    amountAtRisk: value.amountAtRisk
  })) satisfies ProviderOperationsDenialReasonMetric[];
}

function urgencyTone(urgency: ProviderOperationsUrgency): ProviderOperationsWidgetTone {
  switch (urgency) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    default:
      return 'success';
  }
}

function buildAttentionItems(input: {
  scheduling: ProviderOperationsSessionRecord[];
  authorizations: ProviderOperationsAuthorizationRecord[];
  utilization: ProviderOperationsUtilizationRecord[];
  claims: ProviderOperationsClaimRecord[];
}) {
  const authsDueSoon = input.authorizations.filter((authorization) =>
    authorization.status === 'due_soon'
  );
  const expiredButScheduled = input.authorizations.filter((authorization) =>
    authorization.status === 'expired' && authorization.upcomingScheduledSessions > 0
  );
  const claimsDeniedToday = input.claims.filter((claim) => claim.status === 'denied');
  const claimsNeedingResubmission = input.claims.filter((claim) =>
    claim.status === 'pending_resubmission'
  );
  const eligibilityMissing = input.scheduling.filter((session) =>
    session.issueFlags.some((flag) => /eligibility/i.test(flag))
  );
  const scheduleGaps = input.scheduling.filter((session) => session.status === 'open_slot');
  const overloadedStaff = input.utilization.filter((record) => record.utilizationPercent > 95);
  const lowRemainingVisits = input.authorizations.filter((authorization) =>
    authorization.remainingVisits <= 4
  );
  const sessionsAtRisk = input.scheduling.filter((session) =>
    session.status === 'at_risk' ||
    session.status === 'documentation_needed' ||
    session.issueFlags.some((flag) => /auth|coverage|unsigned|eligibility/i.test(flag))
  );

  const items: ProviderOperationsAttentionItem[] = [
    {
      id: 'auths_due_soon',
      label: 'Auths due in 3 days',
      count: authsDueSoon.length,
      urgency: authsDueSoon.length > 0 ? 'high' : 'steady',
      summary: 'Authorizations that will expire before this week closes.',
      detail: 'Review upcoming ABA sessions before units or end dates run out.',
      href: '/provider/dashboard?detail=authorizations&filter=due_soon',
      preview: authsDueSoon.map((authorization) => `${authorization.patientName}: ${authorization.remainingVisits} visits left`)
    },
    {
      id: 'expired_but_scheduled',
      label: 'Expired but scheduled',
      count: expiredButScheduled.length,
      urgency: expiredButScheduled.length > 0 ? 'critical' : 'steady',
      summary: 'Future sessions are scheduled against expired authorization windows.',
      detail: 'These sessions are likely to create denials if left untouched.',
      href: '/provider/dashboard?detail=authorizations&filter=expired',
      preview: expiredButScheduled.map((authorization) => `${authorization.patientName}: ${authorization.upcomingScheduledSessions} sessions impacted`)
    },
    {
      id: 'claims_denied_today',
      label: 'Claims denied today',
      count: claimsDeniedToday.length,
      urgency: claimsDeniedToday.length > 0 ? 'critical' : 'steady',
      summary: 'New denials requiring central office follow-up.',
      detail: 'Prioritize ABA claim corrections before timely filing risk grows.',
      href: '/provider/dashboard?detail=claims&filter=denied',
      preview: claimsDeniedToday.map((claim) => `${claim.patientName}: ${claim.denialReason ?? 'Denied'}`)
    },
    {
      id: 'claims_needing_resubmission',
      label: 'Needs resubmission',
      count: claimsNeedingResubmission.length,
      urgency: claimsNeedingResubmission.length > 0 ? 'high' : 'steady',
      summary: 'Claims with clear next steps but work still open.',
      detail: 'Move these back into the payer pipeline quickly.',
      href: '/provider/dashboard?detail=claims&filter=resubmission',
      preview: claimsNeedingResubmission.map((claim) => `${claim.patientName}: ${claim.nextAction}`)
    },
    {
      id: 'eligibility_missing',
      label: 'Missing eligibility verification',
      count: eligibilityMissing.length,
      urgency: eligibilityMissing.length > 0 ? 'high' : 'steady',
      summary: 'Sessions starting without fresh coverage confirmation.',
      detail: 'Catch family-facing eligibility issues before service starts.',
      href: '/provider/dashboard?detail=scheduling&filter=eligibility_missing',
      preview: eligibilityMissing.map((session) => `${session.patientName}: ${session.startTime}`)
    },
    {
      id: 'schedule_gaps',
      label: 'Unfilled therapist gaps',
      count: scheduleGaps.length,
      urgency: scheduleGaps.length > 0 ? 'critical' : 'steady',
      summary: 'Open session coverage gaps from cancellations or staffing drift.',
      detail: 'Fill these before families are impacted.',
      href: '/provider/dashboard?detail=scheduling&filter=open_slot',
      preview: scheduleGaps.map((session) => `${session.patientName}: ${session.organizationUnitName}`)
    },
    {
      id: 'overloaded_staff',
      label: 'Overloaded therapists',
      count: overloadedStaff.length,
      urgency: overloadedStaff.length > 0 ? 'high' : 'steady',
      summary: 'Therapists at risk of missed supervision or burnout today.',
      detail: 'Rebalance schedule load before more sessions go unstable.',
      href: '/provider/dashboard?detail=utilization&filter=overloaded',
      preview: overloadedStaff.map((record) => `${record.therapistName}: ${record.utilizationPercent}%`)
    },
    {
      id: 'low_remaining_visits',
      label: 'Low visits remaining',
      count: lowRemainingVisits.length,
      urgency: lowRemainingVisits.length > 0 ? 'high' : 'steady',
      summary: 'Active cases are close to exhausting authorized units.',
      detail: 'Plan extensions before high-frequency ABA schedules are interrupted.',
      href: '/provider/dashboard?detail=authorizations&filter=low_visits',
      preview: lowRemainingVisits.map((authorization) => `${authorization.patientName}: ${authorization.remainingVisits} left`)
    },
    {
      id: 'sessions_at_risk',
      label: 'Sessions at risk today',
      count: sessionsAtRisk.length,
      urgency: sessionsAtRisk.length > 0 ? 'critical' : 'steady',
      summary: 'Today’s session plan has readiness, staffing, or documentation risk.',
      detail: 'These are the sessions most likely to break today.',
      href: '/provider/dashboard?detail=scheduling&filter=at_risk',
      preview: sessionsAtRisk.map((session) => `${session.patientName}: ${session.nextAction}`)
    }
  ];

  return items;
}

function buildWidgets(input: {
  scheduling: ProviderOperationsSchedulingSection;
  authorizations: ProviderOperationsAuthorizationsSection;
  utilization: ProviderOperationsUtilizationSection;
  claims: ProviderOperationsClaimsSection;
  tenantId: string;
  activeOrganizationUnitId: string | null;
  accessibleOrganizationUnitIds: string[];
  rollupAuthorized: boolean;
}) {
  const widgetSeed: Record<
    ProviderOperationsWidgetId,
    {
      title: string;
      description: string;
      sectionMetrics: ProviderOperationsSummaryMetric[];
      detail: string;
      href: string;
      ctaLabel: string;
      tone: ProviderOperationsWidgetTone;
      sourceTypes: ProviderOperationsWidgetContract['sourceTypes'];
    }
  > = {
    scheduling: {
      title: 'Scheduling',
      description: 'Day-of ABA session coordination and readiness.',
      sectionMetrics: input.scheduling.metrics,
      detail: 'Today’s schedule calls out open coverage, cancellations, eligibility gaps, and sessions that central office staff need to rescue.',
      href: '/provider/dashboard?detail=scheduling&filter=all',
      ctaLabel: 'Open day schedule',
      tone: 'warning',
      sourceTypes: ['google_cloud_warehouse', 'central_reach']
    },
    authorizations: {
      title: 'Authorizations',
      description: 'Authorization pressure, low visits, and expiring cases.',
      sectionMetrics: input.authorizations.metrics,
      detail: 'ABA authorizations are tracked against remaining visits, future scheduled sessions, and follow-up readiness.',
      href: '/provider/dashboard?detail=authorizations&filter=due_soon',
      ctaLabel: 'Open auth work',
      tone: 'warning',
      sourceTypes: ['clearinghouse_environment']
    },
    claims: {
      title: 'Claims & Billing',
      description: 'Denials, resubmissions, and revenue at risk.',
      sectionMetrics: input.claims.metrics,
      detail: 'Claims status follows service delivery accuracy, payer requirements, and correction workflow.',
      href: '/provider/dashboard?detail=claims&filter=denied',
      ctaLabel: 'Open denied claims',
      tone: 'danger',
      sourceTypes: ['clearinghouse_environment']
    },
    billing: {
      title: 'Claims & Billing',
      description: 'Claims pipeline and billing execution in one operational lane.',
      sectionMetrics: input.claims.metrics,
      detail: 'Use this lane to move denials, monitor resubmissions, and protect cash flow.',
      href: '/provider/dashboard?detail=claims&filter=at_risk',
      ctaLabel: 'Inspect billing risk',
      tone: 'danger',
      sourceTypes: ['clearinghouse_environment']
    },
    utilization: {
      title: 'Utilization',
      description: 'Capacity balance across therapists and supervising staff.',
      sectionMetrics: input.utilization.metrics,
      detail: 'Utilization highlights overload, underused capacity, and gaps that can absorb late changes.',
      href: '/provider/dashboard?detail=utilization&filter=all',
      ctaLabel: 'Review therapist load',
      tone: 'info',
      sourceTypes: ['google_cloud_warehouse', 'central_reach']
    }
  };

  return Object.entries(widgetSeed).map(([id, definition]) => ({
    id: id as ProviderOperationsWidgetId,
    title: definition.title,
    description: definition.description,
    summary: `${definition.sectionMetrics[0]?.value ?? '0'} ${definition.sectionMetrics[0]?.label.toLowerCase() ?? ''}`.trim(),
    detail: definition.detail,
    highlights: definition.sectionMetrics.slice(1, 4).map((metric) => `${metric.label}: ${metric.value}`),
    tone: definition.tone,
    href: definition.href,
    ctaLabel: definition.ctaLabel,
    scope: {
      mode: input.rollupAuthorized && (id === 'claims' || id === 'billing' || id === 'utilization')
        ? 'rollup'
        : 'organization_unit',
      tenantId: input.tenantId,
      activeOrganizationUnitId: input.activeOrganizationUnitId,
      accessibleOrganizationUnitIds: input.accessibleOrganizationUnitIds,
      rollupAuthorized: input.rollupAuthorized
    },
    sourceTypes: definition.sourceTypes
  })) satisfies ProviderOperationsWidgetContract[];
}

export function buildProviderOperationsDashboardModel(input: {
  user: PortalSessionUser;
  rollupAuthorized: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const cycleIndex = minuteBucket(now);
  const sessions = filterByScope(cloneSessions(cycleIndex), input.user, false);
  const authorizations = filterByScope(
    cloneAuthorizations(cycleIndex),
    input.user,
    input.rollupAuthorized
  );
  const utilization = filterByScope(
    cloneUtilization(cycleIndex),
    input.user,
    input.rollupAuthorized
  );
  const claims = filterByScope(cloneClaims(cycleIndex), input.user, input.rollupAuthorized);

  const schedulingSection = {
    metrics: buildSchedulingMetrics(sessions),
    sessions
  } satisfies ProviderOperationsSchedulingSection;
  const authorizationsSection = {
    metrics: buildAuthorizationMetrics(authorizations),
    authorizations
  } satisfies ProviderOperationsAuthorizationsSection;
  const utilizationSection = {
    metrics: buildUtilizationMetrics(utilization),
    therapists: utilization
  } satisfies ProviderOperationsUtilizationSection;
  const claimsSection = {
    metrics: buildClaimsMetrics(claims),
    claims,
    pipeline: buildPipeline(claims),
    denialReasons: buildDenialReasons(claims),
    dollarAmountAtRisk: claims
      .filter((claim) => claim.status === 'denied' || claim.status === 'pending_resubmission')
      .reduce((sum, claim) => sum + claim.amount, 0)
  } satisfies ProviderOperationsClaimsSection;

  const attentionItems = buildAttentionItems({
    scheduling: sessions,
    authorizations,
    utilization,
    claims
  });
  const accessibleOrganizationUnitIds = input.user.session.availableOrganizationUnits.map(
    (organizationUnit) => organizationUnit.id
  );
  const organizationUnits = input.user.session.availableOrganizationUnits.map((organizationUnit) => ({
    id: organizationUnit.id,
    name: organizationUnit.name,
    type: organizationUnit.type,
    isActive: organizationUnit.id === input.user.session.activeOrganizationUnit?.id
  })) satisfies ProviderOperationsOrganizationUnitOption[];

  const widgets = buildWidgets({
    scheduling: schedulingSection,
    authorizations: authorizationsSection,
    utilization: utilizationSection,
    claims: claimsSection,
    tenantId: input.user.tenant.id,
    activeOrganizationUnitId: input.user.session.activeOrganizationUnit?.id ?? null,
    accessibleOrganizationUnitIds,
    rollupAuthorized: input.rollupAuthorized
  });

  return {
    source: 'platform_provider_operations_data_layer',
    personaCode: input.user.session.personaType,
    tenantId: input.user.tenant.id,
    activeOrganizationUnitId: input.user.session.activeOrganizationUnit?.id ?? null,
    generatedAt: now.toISOString(),
    refreshIntervalSeconds: REFRESH_INTERVAL_SECONDS,
    alertsCount: attentionItems.reduce((sum, item) => sum + item.count, 0),
    organizationUnits,
    quickActions: QUICK_ACTIONS,
    attentionItems,
    widgets,
    scheduling: schedulingSection,
    authorizations: authorizationsSection,
    utilization: utilizationSection,
    claims: claimsSection
  } satisfies ProviderOperationsDashboardContract;
}

export function getUrgencyTone(urgency: ProviderOperationsUrgency) {
  return urgencyTone(urgency);
}
