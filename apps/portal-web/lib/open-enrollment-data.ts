export type OpenEnrollmentStatus =
  | 'Completed'
  | 'Pending'
  | 'In Progress'
  | 'Needs Review'
  | 'Admin Override';

export type OpenEnrollmentCoverageTier =
  | 'Employee Only'
  | 'Employee + Spouse'
  | 'Employee + Child(ren)'
  | 'Family'
  | 'Waived';

export type OpenEnrollmentRecord = {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  enrollmentStatus: OpenEnrollmentStatus;
  selectedPlan: string;
  coverageTier: OpenEnrollmentCoverageTier;
  submissionDate?: string;
  lastReminderSent?: string;
  reminderFailures: number;
  currentCoverage: {
    plan: string;
    tier: OpenEnrollmentCoverageTier;
    monthlyContribution: number;
  };
  newCoverage: {
    plan: string;
    tier: OpenEnrollmentCoverageTier;
    monthlyContribution: number;
  };
  dependents: Array<{
    id: string;
    name: string;
    relationship: string;
    coverageStatus: 'Covered' | 'Pending' | 'Not Covered';
  }>;
  submittedAt?: string;
  auditHistory: Array<{
    id: string;
    action: string;
    actor: string;
    occurredAt: string;
    details: string;
  }>;
};

export type EnrollmentCycle = {
  id: string;
  status: 'Active' | 'Scheduled' | 'Closed';
  startDate: string;
  endDate: string;
  totalEligibleEmployees: number;
};

export type OpenEnrollmentSummary = {
  status: EnrollmentCycle['status'] | 'No Active Enrollment';
  startDate?: string;
  endDate?: string;
  totalEligibleEmployees: number;
  employeesCompleted: number;
  employeesPending: number;
  completionRate: number;
};

export type OpenEnrollmentAnalytics = {
  completionTrend: Array<{ label: string; value: number }>;
  planSelectionBreakdown: Array<{ label: string; value: number }>;
  coverageTierDistribution: Array<{ label: string; value: number }>;
  departmentCompletionRates: Array<{ label: string; value: number }>;
};

const baseCycle: EnrollmentCycle = {
  id: 'oe-cycle-2026-fall',
  status: 'Active',
  startDate: '2026-10-15',
  endDate: '2026-11-15',
  totalEligibleEmployees: 423
};

const seedRecords: OpenEnrollmentRecord[] = [
  {
    id: 'oe-emp-1001',
    employeeName: 'Olivia Carter',
    employeeId: 'E-1001',
    department: 'Finance',
    enrollmentStatus: 'Completed',
    selectedPlan: 'Blue Horizon Silver HMO',
    coverageTier: 'Family',
    submissionDate: '2026-10-19',
    lastReminderSent: '2026-10-17',
    reminderFailures: 0,
    currentCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Family',
      monthlyContribution: 254
    },
    newCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Family',
      monthlyContribution: 178
    },
    dependents: [
      {
        id: 'oe-dep-1001-1',
        name: 'James Carter',
        relationship: 'Spouse',
        coverageStatus: 'Covered'
      },
      {
        id: 'oe-dep-1001-2',
        name: 'Mia Carter',
        relationship: 'Child',
        coverageStatus: 'Covered'
      }
    ],
    submittedAt: '2026-10-19T14:23:00Z',
    auditHistory: [
      {
        id: 'oe-audit-1001-1',
        action: 'Enrollment Started',
        actor: 'Olivia Carter',
        occurredAt: '2026-10-17T09:12:00Z',
        details: 'Open enrollment session started.'
      },
      {
        id: 'oe-audit-1001-2',
        action: 'Enrollment Submitted',
        actor: 'Olivia Carter',
        occurredAt: '2026-10-19T14:23:00Z',
        details: 'Plan election submitted and confirmation generated.'
      }
    ]
  },
  {
    id: 'oe-emp-1002',
    employeeName: 'Daniel Nguyen',
    employeeId: 'E-1002',
    department: 'Engineering',
    enrollmentStatus: 'In Progress',
    selectedPlan: 'Blue Horizon Silver HMO',
    coverageTier: 'Employee + Child(ren)',
    submissionDate: '2026-10-23',
    lastReminderSent: '2026-10-24',
    reminderFailures: 0,
    currentCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee + Child(ren)',
      monthlyContribution: 172
    },
    newCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee + Child(ren)',
      monthlyContribution: 165
    },
    dependents: [
      {
        id: 'oe-dep-1002-1',
        name: 'Avery Nguyen',
        relationship: 'Child',
        coverageStatus: 'Covered'
      }
    ],
    submittedAt: '2026-10-23T11:02:00Z',
    auditHistory: [
      {
        id: 'oe-audit-1002-1',
        action: 'Enrollment Started',
        actor: 'Daniel Nguyen',
        occurredAt: '2026-10-22T17:44:00Z',
        details: 'Started election flow from benefits homepage.'
      },
      {
        id: 'oe-audit-1002-2',
        action: 'Draft Saved',
        actor: 'Daniel Nguyen',
        occurredAt: '2026-10-23T11:02:00Z',
        details: 'Draft includes dependent coverage changes.'
      }
    ]
  },
  {
    id: 'oe-emp-1003',
    employeeName: 'Priya Shah',
    employeeId: 'E-1003',
    department: 'People Operations',
    enrollmentStatus: 'Pending',
    selectedPlan: 'Not Selected',
    coverageTier: 'Employee Only',
    lastReminderSent: '2026-10-25',
    reminderFailures: 0,
    currentCoverage: {
      plan: 'No Active Coverage',
      tier: 'Employee Only',
      monthlyContribution: 0
    },
    newCoverage: {
      plan: 'Pending Election',
      tier: 'Employee Only',
      monthlyContribution: 0
    },
    dependents: [],
    auditHistory: [
      {
        id: 'oe-audit-1003-1',
        action: 'Reminder Sent',
        actor: 'Employer Admin',
        occurredAt: '2026-10-25T08:00:00Z',
        details: 'Portal reminder sent for open enrollment completion.'
      }
    ]
  },
  {
    id: 'oe-emp-1004',
    employeeName: 'Marcus Reed',
    employeeId: 'E-1004',
    department: 'Sales',
    enrollmentStatus: 'Needs Review',
    selectedPlan: 'Blue Horizon Gold PPO',
    coverageTier: 'Employee Only',
    submissionDate: '2026-10-20',
    lastReminderSent: '2026-10-21',
    reminderFailures: 1,
    currentCoverage: {
      plan: 'Waived',
      tier: 'Waived',
      monthlyContribution: 0
    },
    newCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Employee Only',
      monthlyContribution: 112
    },
    dependents: [],
    submittedAt: '2026-10-20T16:54:00Z',
    auditHistory: [
      {
        id: 'oe-audit-1004-1',
        action: 'Enrollment Submitted',
        actor: 'Marcus Reed',
        occurredAt: '2026-10-20T16:54:00Z',
        details: 'Election submitted with missing coverage attestation.'
      },
      {
        id: 'oe-audit-1004-2',
        action: 'Needs Review',
        actor: 'Dana Price (Benefits Admin)',
        occurredAt: '2026-10-21T09:06:00Z',
        details: 'Review requested for waiver-to-enroll change.'
      }
    ]
  },
  {
    id: 'oe-emp-1005',
    employeeName: 'Elena Torres',
    employeeId: 'E-1005',
    department: 'Operations',
    enrollmentStatus: 'Completed',
    selectedPlan: 'Waived',
    coverageTier: 'Waived',
    submissionDate: '2026-10-18',
    reminderFailures: 0,
    currentCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee + Spouse',
      monthlyContribution: 146
    },
    newCoverage: {
      plan: 'Waived',
      tier: 'Waived',
      monthlyContribution: 0
    },
    dependents: [
      {
        id: 'oe-dep-1005-1',
        name: 'Luis Torres',
        relationship: 'Spouse',
        coverageStatus: 'Not Covered'
      }
    ],
    submittedAt: '2026-10-18T12:17:00Z',
    auditHistory: [
      {
        id: 'oe-audit-1005-1',
        action: 'Enrollment Submitted',
        actor: 'Elena Torres',
        occurredAt: '2026-10-18T12:17:00Z',
        details: 'Waiver election submitted and accepted.'
      }
    ]
  },
  {
    id: 'oe-emp-1006',
    employeeName: 'Noah Bennett',
    employeeId: 'E-1006',
    department: 'Engineering',
    enrollmentStatus: 'Pending',
    selectedPlan: 'Not Selected',
    coverageTier: 'Employee Only',
    reminderFailures: 2,
    currentCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Employee Only',
      monthlyContribution: 124
    },
    newCoverage: {
      plan: 'Pending Election',
      tier: 'Employee Only',
      monthlyContribution: 0
    },
    dependents: [],
    auditHistory: [
      {
        id: 'oe-audit-1006-1',
        action: 'Reminder Failed',
        actor: 'Notification Service',
        occurredAt: '2026-10-24T15:04:00Z',
        details: 'Email reminder bounced due to mailbox restriction.'
      }
    ]
  }
];

function cloneRecord(record: OpenEnrollmentRecord): OpenEnrollmentRecord {
  return {
    ...record,
    currentCoverage: { ...record.currentCoverage },
    newCoverage: { ...record.newCoverage },
    dependents: record.dependents.map((dependent) => ({ ...dependent })),
    auditHistory: record.auditHistory.map((item) => ({ ...item }))
  };
}

export function getOpenEnrollmentCycleForTenant(tenantId: string): EnrollmentCycle | null {
  if (tenantId.toLowerCase().includes('no-open')) {
    return null;
  }

  const offset = tenantId.length % 4;
  return {
    ...baseCycle,
    totalEligibleEmployees: baseCycle.totalEligibleEmployees + offset
  };
}

export function getOpenEnrollmentRecordsForTenant(tenantId: string): OpenEnrollmentRecord[] {
  return seedRecords.map((record) => {
    const scoped = cloneRecord(record);
    return {
      ...scoped,
      id: `${tenantId}-${scoped.id}`,
      employeeId: `${scoped.employeeId}-${tenantId.slice(0, 4).toUpperCase()}`
    };
  });
}

export function getOpenEnrollmentRecordByIdForTenant(tenantId: string, recordId: string) {
  return getOpenEnrollmentRecordsForTenant(tenantId).find((record) => record.id === recordId) ?? null;
}

export function buildOpenEnrollmentSummary(
  cycle: EnrollmentCycle | null,
  records: OpenEnrollmentRecord[]
): OpenEnrollmentSummary {
  if (!cycle) {
    return {
      status: 'No Active Enrollment',
      totalEligibleEmployees: 0,
      employeesCompleted: 0,
      employeesPending: 0,
      completionRate: 0
    };
  }

  const employeesCompleted = records.filter((record) => record.enrollmentStatus === 'Completed').length;
  const employeesPending = records.filter((record) => record.enrollmentStatus !== 'Completed').length;
  const completionRate = cycle.totalEligibleEmployees > 0
    ? (employeesCompleted / cycle.totalEligibleEmployees) * 100
    : 0;

  return {
    status: cycle.status,
    startDate: cycle.startDate,
    endDate: cycle.endDate,
    totalEligibleEmployees: cycle.totalEligibleEmployees,
    employeesCompleted,
    employeesPending,
    completionRate
  };
}

export function getOpenEnrollmentSummaryForTenant(tenantId: string): OpenEnrollmentSummary {
  const cycle = getOpenEnrollmentCycleForTenant(tenantId);
  const records = getOpenEnrollmentRecordsForTenant(tenantId);
  return buildOpenEnrollmentSummary(cycle, records);
}

export function getOpenEnrollmentFilterOptions(records: OpenEnrollmentRecord[]) {
  const departments = Array.from(new Set(records.map((record) => record.department))).sort();
  const planSelections = Array.from(new Set(records.map((record) => record.selectedPlan))).sort();
  const coverageTiers = Array.from(new Set(records.map((record) => record.coverageTier))).sort();

  return {
    departments,
    planSelections,
    coverageTiers
  };
}

export function getOpenEnrollmentAnalytics(records: OpenEnrollmentRecord[]): OpenEnrollmentAnalytics {
  const completionTrend = [
    { label: 'Week 1', value: Math.max(0, Math.floor(records.length * 0.18)) },
    { label: 'Week 2', value: Math.max(0, Math.floor(records.length * 0.36)) },
    { label: 'Week 3', value: Math.max(0, Math.floor(records.length * 0.62)) },
    {
      label: 'Week 4',
      value: records.filter((record) => record.enrollmentStatus === 'Completed').length
    }
  ];

  const planMap = new Map<string, number>();
  const tierMap = new Map<string, number>();
  const deptTotals = new Map<string, { total: number; completed: number }>();

  for (const record of records) {
    planMap.set(record.selectedPlan, (planMap.get(record.selectedPlan) ?? 0) + 1);
    tierMap.set(record.coverageTier, (tierMap.get(record.coverageTier) ?? 0) + 1);

    const currentDepartment = deptTotals.get(record.department) ?? { total: 0, completed: 0 };
    currentDepartment.total += 1;
    if (record.enrollmentStatus === 'Completed') {
      currentDepartment.completed += 1;
    }
    deptTotals.set(record.department, currentDepartment);
  }

  const planSelectionBreakdown = Array.from(planMap.entries()).map(([label, value]) => ({
    label,
    value
  }));

  const coverageTierDistribution = Array.from(tierMap.entries()).map(([label, value]) => ({
    label,
    value
  }));

  const departmentCompletionRates = Array.from(deptTotals.entries()).map(([label, values]) => ({
    label,
    value: values.total > 0 ? Number(((values.completed / values.total) * 100).toFixed(1)) : 0
  }));

  return {
    completionTrend,
    planSelectionBreakdown,
    coverageTierDistribution,
    departmentCompletionRates
  };
}

export function getOpenEnrollmentAnalyticsForTenant(tenantId: string): OpenEnrollmentAnalytics {
  return getOpenEnrollmentAnalytics(getOpenEnrollmentRecordsForTenant(tenantId));
}

export function getPendingReminderTargets(records: OpenEnrollmentRecord[]) {
  return records.filter((record) => record.enrollmentStatus !== 'Completed');
}
