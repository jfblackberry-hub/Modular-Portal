export type CensusEmployeeStatus =
  | 'Active'
  | 'Terminated'
  | 'Pending Enrollment'
  | 'Waived';

export type CoverageType =
  | 'Employee Only'
  | 'Employee + Spouse'
  | 'Employee + Child(ren)'
  | 'Family'
  | 'Waived';

export type DependentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  relationship: 'Spouse' | 'Child' | 'Other';
  dateOfBirth: string;
  coverageStatus: 'Covered' | 'Pending' | 'Not Covered';
};

export type EnrollmentHistoryRecord = {
  id: string;
  planName: string;
  coverageType: CoverageType;
  status: 'Active' | 'Terminated' | 'Pending' | 'Waived';
  effectiveDate: string;
  endDate?: string;
  source: 'Open Enrollment' | 'Life Event' | 'New Hire' | 'Manual Update';
};

export type LifeEventRecord = {
  id: string;
  eventType: string;
  eventDate: string;
  status: 'Approved' | 'Pending' | 'Denied';
};

export type EmployeeCensusRecord = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  title: string;
  location: string;
  status: CensusEmployeeStatus;
  coverageStatus: 'Enrolled' | 'Pending' | 'Waived' | 'Terminated';
  coverageType: CoverageType;
  planSelection: string;
  effectiveDate: string;
  terminationDate?: string;
  eligibilityStatus: 'Eligible' | 'Pending Review' | 'Ineligible';
  dependents: DependentRecord[];
  enrollmentHistory: EnrollmentHistoryRecord[];
  lifeEvents: LifeEventRecord[];
  billingImpact: {
    monthlyEmployerContribution: number;
    monthlyEmployeeContribution: number;
    notes: string;
  };
};

export type WorkforceCoverageSummary = {
  eligibleEmployees: number;
  enrolledEmployees: number;
  waivedEmployees: number;
  dependentsCovered: number;
  coveredLives: number;
  coverageRate: number;
};

const seedEmployees: EmployeeCensusRecord[] = [
  {
    id: 'emp-1001',
    employeeId: 'E-1001',
    firstName: 'Olivia',
    lastName: 'Carter',
    email: 'olivia.carter@bluehorizon.example',
    department: 'Finance',
    title: 'Payroll Manager',
    location: 'Detroit, MI',
    status: 'Active',
    coverageStatus: 'Enrolled',
    coverageType: 'Family',
    planSelection: 'Blue Horizon Gold PPO',
    effectiveDate: '2026-01-01',
    eligibilityStatus: 'Eligible',
    dependents: [
      {
        id: 'dep-1001-1',
        firstName: 'James',
        lastName: 'Carter',
        relationship: 'Spouse',
        dateOfBirth: '1987-08-19',
        coverageStatus: 'Covered'
      },
      {
        id: 'dep-1001-2',
        firstName: 'Mia',
        lastName: 'Carter',
        relationship: 'Child',
        dateOfBirth: '2014-04-06',
        coverageStatus: 'Covered'
      }
    ],
    enrollmentHistory: [
      {
        id: 'hist-1001-1',
        planName: 'Blue Horizon Silver HMO',
        coverageType: 'Employee + Spouse',
        status: 'Terminated',
        effectiveDate: '2025-01-01',
        endDate: '2025-12-31',
        source: 'Open Enrollment'
      },
      {
        id: 'hist-1001-2',
        planName: 'Blue Horizon Gold PPO',
        coverageType: 'Family',
        status: 'Active',
        effectiveDate: '2026-01-01',
        source: 'Open Enrollment'
      }
    ],
    lifeEvents: [
      {
        id: 'life-1001-1',
        eventType: 'Dependent Added',
        eventDate: '2025-07-14',
        status: 'Approved'
      }
    ],
    billingImpact: {
      monthlyEmployerContribution: 980,
      monthlyEmployeeContribution: 254,
      notes: 'Family tier contribution current and in good standing.'
    }
  },
  {
    id: 'emp-1002',
    employeeId: 'E-1002',
    firstName: 'Daniel',
    lastName: 'Nguyen',
    email: 'daniel.nguyen@bluehorizon.example',
    department: 'Engineering',
    title: 'Software Engineer',
    location: 'Ann Arbor, MI',
    status: 'Active',
    coverageStatus: 'Enrolled',
    coverageType: 'Employee + Child(ren)',
    planSelection: 'Blue Horizon Silver HMO',
    effectiveDate: '2026-01-01',
    eligibilityStatus: 'Eligible',
    dependents: [
      {
        id: 'dep-1002-1',
        firstName: 'Avery',
        lastName: 'Nguyen',
        relationship: 'Child',
        dateOfBirth: '2018-12-02',
        coverageStatus: 'Covered'
      }
    ],
    enrollmentHistory: [
      {
        id: 'hist-1002-1',
        planName: 'Blue Horizon Silver HMO',
        coverageType: 'Employee + Child(ren)',
        status: 'Active',
        effectiveDate: '2026-01-01',
        source: 'Open Enrollment'
      }
    ],
    lifeEvents: [],
    billingImpact: {
      monthlyEmployerContribution: 715,
      monthlyEmployeeContribution: 172,
      notes: 'Coverage stable. No delinquency.'
    }
  },
  {
    id: 'emp-1003',
    employeeId: 'E-1003',
    firstName: 'Priya',
    lastName: 'Shah',
    email: 'priya.shah@bluehorizon.example',
    department: 'People Operations',
    title: 'HR Generalist',
    location: 'Detroit, MI',
    status: 'Pending Enrollment',
    coverageStatus: 'Pending',
    coverageType: 'Employee Only',
    planSelection: 'Blue Horizon Gold PPO',
    effectiveDate: '2026-04-01',
    eligibilityStatus: 'Pending Review',
    dependents: [],
    enrollmentHistory: [
      {
        id: 'hist-1003-1',
        planName: 'Blue Horizon Gold PPO',
        coverageType: 'Employee Only',
        status: 'Pending',
        effectiveDate: '2026-04-01',
        source: 'New Hire'
      }
    ],
    lifeEvents: [],
    billingImpact: {
      monthlyEmployerContribution: 0,
      monthlyEmployeeContribution: 0,
      notes: 'Contribution starts once enrollment is activated.'
    }
  },
  {
    id: 'emp-1004',
    employeeId: 'E-1004',
    firstName: 'Marcus',
    lastName: 'Reed',
    email: 'marcus.reed@bluehorizon.example',
    department: 'Sales',
    title: 'Account Executive',
    location: 'Grand Rapids, MI',
    status: 'Waived',
    coverageStatus: 'Waived',
    coverageType: 'Waived',
    planSelection: 'Waived',
    effectiveDate: '2026-01-01',
    eligibilityStatus: 'Eligible',
    dependents: [],
    enrollmentHistory: [
      {
        id: 'hist-1004-1',
        planName: 'Waived',
        coverageType: 'Waived',
        status: 'Waived',
        effectiveDate: '2026-01-01',
        source: 'Open Enrollment'
      }
    ],
    lifeEvents: [
      {
        id: 'life-1004-1',
        eventType: 'Waiver Submitted',
        eventDate: '2025-11-22',
        status: 'Approved'
      }
    ],
    billingImpact: {
      monthlyEmployerContribution: 0,
      monthlyEmployeeContribution: 0,
      notes: 'Employee waived medical coverage for this plan year.'
    }
  },
  {
    id: 'emp-1005',
    employeeId: 'E-1005',
    firstName: 'Elena',
    lastName: 'Torres',
    email: 'elena.torres@bluehorizon.example',
    department: 'Operations',
    title: 'Operations Analyst',
    location: 'Detroit, MI',
    status: 'Terminated',
    coverageStatus: 'Terminated',
    coverageType: 'Employee + Spouse',
    planSelection: 'Blue Horizon Silver HMO',
    effectiveDate: '2025-01-01',
    terminationDate: '2026-02-15',
    eligibilityStatus: 'Ineligible',
    dependents: [
      {
        id: 'dep-1005-1',
        firstName: 'Luis',
        lastName: 'Torres',
        relationship: 'Spouse',
        dateOfBirth: '1990-01-27',
        coverageStatus: 'Not Covered'
      }
    ],
    enrollmentHistory: [
      {
        id: 'hist-1005-1',
        planName: 'Blue Horizon Silver HMO',
        coverageType: 'Employee + Spouse',
        status: 'Terminated',
        effectiveDate: '2025-01-01',
        endDate: '2026-02-15',
        source: 'Manual Update'
      }
    ],
    lifeEvents: [
      {
        id: 'life-1005-1',
        eventType: 'Termination Processed',
        eventDate: '2026-02-15',
        status: 'Approved'
      }
    ],
    billingImpact: {
      monthlyEmployerContribution: 0,
      monthlyEmployeeContribution: 0,
      notes: 'Coverage terminated. No current premium impact.'
    }
  }
];

function cloneEmployee(record: EmployeeCensusRecord): EmployeeCensusRecord {
  return {
    ...record,
    dependents: record.dependents.map((dependent) => ({ ...dependent })),
    enrollmentHistory: record.enrollmentHistory.map((history) => ({ ...history })),
    lifeEvents: record.lifeEvents.map((lifeEvent) => ({ ...lifeEvent })),
    billingImpact: { ...record.billingImpact }
  };
}

export function getEmployerCensusRecordsForTenant(tenantId: string): EmployeeCensusRecord[] {
  return seedEmployees.map((employee) => {
    const scoped = cloneEmployee(employee);
    return {
      ...scoped,
      id: `${tenantId}-${scoped.id}`,
      employeeId: `${scoped.employeeId}-${tenantId.slice(0, 4).toUpperCase()}`
    };
  });
}

export function getEmployeeByIdForTenant(tenantId: string, employeeId: string) {
  const records = getEmployerCensusRecordsForTenant(tenantId);
  return records.find((employee) => employee.id === employeeId) ?? null;
}

export function buildWorkforceCoverageSummary(
  employees: EmployeeCensusRecord[],
  fallbackEligibleEmployees = 512
): WorkforceCoverageSummary {
  const eligibleEmployees = Math.max(fallbackEligibleEmployees, employees.length);
  const enrolledEmployees = employees.filter(
    (employee) => employee.coverageStatus === 'Enrolled'
  ).length;
  const waivedEmployees = employees.filter(
    (employee) => employee.coverageStatus === 'Waived'
  ).length;
  const dependentsCovered = employees.reduce((total, employee) => {
    return (
      total +
      employee.dependents.filter((dependent) => dependent.coverageStatus === 'Covered').length
    );
  }, 0);
  const coveredLives = enrolledEmployees + dependentsCovered;
  const coverageRate = eligibleEmployees > 0 ? (enrolledEmployees / eligibleEmployees) * 100 : 0;

  return {
    eligibleEmployees,
    enrolledEmployees,
    waivedEmployees,
    dependentsCovered,
    coveredLives,
    coverageRate
  };
}

export function getWorkforceCoverageSummaryForTenant(
  tenantId: string
): WorkforceCoverageSummary {
  const seedOffset = tenantId.length % 3;
  const eligibleEmployees = 512 + seedOffset;
  const enrolledEmployees = 423 + seedOffset;
  const waivedEmployees = 89;
  const dependentsCovered = 612 + seedOffset;
  const coveredLives = enrolledEmployees + dependentsCovered;
  const coverageRate =
    eligibleEmployees > 0 ? (enrolledEmployees / eligibleEmployees) * 100 : 0;

  return {
    eligibleEmployees,
    enrolledEmployees,
    waivedEmployees,
    dependentsCovered,
    coveredLives,
    coverageRate
  };
}

export function getFilterOptions(employees: EmployeeCensusRecord[]) {
  const coverageTypes = Array.from(
    new Set(employees.map((employee) => employee.coverageType))
  ).sort();
  const plans = Array.from(
    new Set(employees.map((employee) => employee.planSelection))
  ).sort();
  const departments = Array.from(
    new Set(employees.map((employee) => employee.department))
  ).sort();

  return {
    coverageTypes,
    plans,
    departments
  };
}
