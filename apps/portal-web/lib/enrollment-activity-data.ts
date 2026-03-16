export type EnrollmentRequestType =
  | 'New Hire Enrollment'
  | 'Open Enrollment Change'
  | 'Qualifying Life Event Change'
  | 'Dependent Add'
  | 'Dependent Removal'
  | 'Coverage Termination'
  | 'Reinstatement';

export type EnrollmentRequestStatus =
  | 'Pending'
  | 'In Progress'
  | 'Needs Correction'
  | 'Approved'
  | 'Rejected'
  | 'Completed'
  | 'Error';

export type EnrollmentErrorState = 'None' | 'Warning' | 'Error';

export type EnrollmentDependentSnapshot = {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
};

export type EnrollmentValidationMessage = {
  id: string;
  severity: 'Warning' | 'Error';
  message: string;
};

export type EnrollmentApprovalEvent = {
  id: string;
  action: string;
  actor: string;
  occurredAt: string;
  note?: string;
};

export type EnrollmentAuditEvent = {
  id: string;
  action: string;
  actor: string;
  occurredAt: string;
  details: string;
};

export type EnrollmentRequestRecord = {
  id: string;
  employeeName: string;
  employeeId: string;
  requestType: EnrollmentRequestType;
  submissionDate: string;
  effectiveDate: string;
  status: EnrollmentRequestStatus;
  submittedBy: string;
  planSelection: string;
  department: string;
  errorState: EnrollmentErrorState;
  errorOrWarningIndicator?: string;
  processedDate?: string;
  processedBy?: string;
  currentCoverage: {
    plan: string;
    tier: string;
    status: string;
  };
  requestedCoverage: {
    plan: string;
    tier: string;
    status: string;
  };
  submittedData: Record<string, string>;
  supportingDependents: EnrollmentDependentSnapshot[];
  qualifyingLifeEvent?: {
    type: string;
    eventDate: string;
    notes: string;
  };
  validationMessages: EnrollmentValidationMessage[];
  approvalHistory: EnrollmentApprovalEvent[];
  auditTrail: EnrollmentAuditEvent[];
};

export type EnrollmentActivitySummary = {
  pendingEnrollments: number;
  pendingTerminations: number;
  pendingLifeEvents: number;
  changesInProgress: number;
  enrollmentErrors: number;
  completedThisWeek: number;
};

const baseRequests: EnrollmentRequestRecord[] = [
  {
    id: 'req-2001',
    employeeName: 'Priya Shah',
    employeeId: 'E-1003',
    requestType: 'New Hire Enrollment',
    submissionDate: '2026-03-12',
    effectiveDate: '2026-04-01',
    status: 'Pending',
    submittedBy: 'Liam Cooper (HR Admin)',
    planSelection: 'Blue Horizon Gold PPO',
    department: 'People Operations',
    errorState: 'None',
    currentCoverage: {
      plan: 'No active coverage',
      tier: 'N/A',
      status: 'Not Enrolled'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Employee Only',
      status: 'Pending Activation'
    },
    submittedData: {
      employmentStatus: 'Full-time',
      hireDate: '2026-03-10',
      waitingPeriodSatisfied: 'Yes',
      workLocation: 'Detroit, MI'
    },
    supportingDependents: [],
    validationMessages: [],
    approvalHistory: [
      {
        id: 'appr-2001-1',
        action: 'Submitted',
        actor: 'Liam Cooper (HR Admin)',
        occurredAt: '2026-03-12T09:18:00Z'
      }
    ],
    auditTrail: [
      {
        id: 'audit-2001-1',
        action: 'Request Created',
        actor: 'Liam Cooper (HR Admin)',
        occurredAt: '2026-03-12T09:18:00Z',
        details: 'New hire enrollment initiated from employer portal.'
      }
    ]
  },
  {
    id: 'req-2002',
    employeeName: 'Olivia Carter',
    employeeId: 'E-1001',
    requestType: 'Open Enrollment Change',
    submissionDate: '2026-03-11',
    effectiveDate: '2026-05-01',
    status: 'In Progress',
    submittedBy: 'Olivia Carter',
    planSelection: 'Blue Horizon Silver HMO',
    department: 'Finance',
    errorState: 'Warning',
    errorOrWarningIndicator: 'PCP assignment pending for one dependent.',
    currentCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Family',
      status: 'Active'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Family',
      status: 'In Review'
    },
    submittedData: {
      openEnrollmentWindow: 'Spring 2026',
      premiumImpact: '-$82 monthly',
      subscriberAcknowledged: 'Yes'
    },
    supportingDependents: [
      { id: 'dep-1001-1', name: 'James Carter', relationship: 'Spouse', dateOfBirth: '1987-08-19' },
      { id: 'dep-1001-2', name: 'Mia Carter', relationship: 'Child', dateOfBirth: '2014-04-06' }
    ],
    validationMessages: [
      {
        id: 'val-2002-1',
        severity: 'Warning',
        message: 'Dependent PCP assignment missing for one household member.'
      }
    ],
    approvalHistory: [
      { id: 'appr-2002-1', action: 'Submitted', actor: 'Olivia Carter', occurredAt: '2026-03-11T14:02:00Z' },
      { id: 'appr-2002-2', action: 'Under Review', actor: 'Dana Price (Benefits Admin)', occurredAt: '2026-03-12T08:35:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2002-1',
        action: 'Coverage Change Requested',
        actor: 'Olivia Carter',
        occurredAt: '2026-03-11T14:02:00Z',
        details: 'Open enrollment plan switch from Gold PPO to Silver HMO.'
      }
    ]
  },
  {
    id: 'req-2003',
    employeeName: 'Daniel Nguyen',
    employeeId: 'E-1002',
    requestType: 'Qualifying Life Event Change',
    submissionDate: '2026-03-13',
    effectiveDate: '2026-04-01',
    status: 'Pending',
    submittedBy: 'Nina Patel (HR Specialist)',
    planSelection: 'Blue Horizon Silver HMO',
    department: 'Engineering',
    errorState: 'None',
    currentCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee + Child(ren)',
      status: 'Active'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Family',
      status: 'Pending Approval'
    },
    submittedData: {
      qleReason: 'Marriage',
      eventVerification: 'Uploaded',
      spouseCoverageCoordination: 'Pending'
    },
    supportingDependents: [
      { id: 'dep-1002-2', name: 'Jordan Hill', relationship: 'Spouse', dateOfBirth: '1991-02-22' }
    ],
    qualifyingLifeEvent: {
      type: 'Marriage',
      eventDate: '2026-03-05',
      notes: 'Marriage certificate uploaded and pending validation.'
    },
    validationMessages: [],
    approvalHistory: [
      { id: 'appr-2003-1', action: 'Submitted', actor: 'Nina Patel (HR Specialist)', occurredAt: '2026-03-13T11:41:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2003-1',
        action: 'QLE Request Logged',
        actor: 'Nina Patel (HR Specialist)',
        occurredAt: '2026-03-13T11:41:00Z',
        details: 'Marriage life event initiated with spouse add request.'
      }
    ]
  },
  {
    id: 'req-2004',
    employeeName: 'Marcus Reed',
    employeeId: 'E-1004',
    requestType: 'Coverage Termination',
    submissionDate: '2026-03-10',
    effectiveDate: '2026-04-30',
    status: 'Pending',
    submittedBy: 'Alana Ross (Employer Admin)',
    planSelection: 'Blue Horizon Gold PPO',
    department: 'Sales',
    errorState: 'None',
    currentCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Employee Only',
      status: 'Active'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Employee Only',
      status: 'Pending Termination'
    },
    submittedData: {
      terminationReason: 'Voluntary resignation',
      cobraNoticeRequired: 'Yes',
      finalPayrollDate: '2026-04-29'
    },
    supportingDependents: [],
    validationMessages: [],
    approvalHistory: [
      { id: 'appr-2004-1', action: 'Submitted', actor: 'Alana Ross (Employer Admin)', occurredAt: '2026-03-10T16:19:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2004-1',
        action: 'Termination Request Submitted',
        actor: 'Alana Ross (Employer Admin)',
        occurredAt: '2026-03-10T16:19:00Z',
        details: 'Coverage termination queued with COBRA follow-up required.'
      }
    ]
  },
  {
    id: 'req-2005',
    employeeName: 'Elena Torres',
    employeeId: 'E-1005',
    requestType: 'Dependent Removal',
    submissionDate: '2026-03-09',
    effectiveDate: '2026-04-01',
    status: 'Needs Correction',
    submittedBy: 'Elena Torres',
    planSelection: 'Blue Horizon Silver HMO',
    department: 'Operations',
    errorState: 'Warning',
    errorOrWarningIndicator: 'Missing signed dependent removal attestation.',
    currentCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee + Spouse',
      status: 'Active'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee Only',
      status: 'Correction Requested'
    },
    submittedData: {
      dependentRemovalReason: 'Divorce',
      supportingDocument: 'Missing',
      attestationSigned: 'No'
    },
    supportingDependents: [
      { id: 'dep-1005-1', name: 'Luis Torres', relationship: 'Spouse', dateOfBirth: '1990-01-27' }
    ],
    validationMessages: [
      {
        id: 'val-2005-1',
        severity: 'Warning',
        message: 'Signed dependent removal attestation is required before approval.'
      }
    ],
    approvalHistory: [
      { id: 'appr-2005-1', action: 'Submitted', actor: 'Elena Torres', occurredAt: '2026-03-09T10:03:00Z' },
      { id: 'appr-2005-2', action: 'Correction Requested', actor: 'Dana Price (Benefits Admin)', occurredAt: '2026-03-10T15:10:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2005-1',
        action: 'Validation Warning',
        actor: 'Enrollment Validation Service',
        occurredAt: '2026-03-10T15:07:00Z',
        details: 'Dependent removal request missing required attestation document.'
      }
    ]
  },
  {
    id: 'req-2006',
    employeeName: 'Noah Bennett',
    employeeId: 'E-1010',
    requestType: 'Dependent Add',
    submissionDate: '2026-03-14',
    effectiveDate: '2026-04-01',
    status: 'Error',
    submittedBy: 'Noah Bennett',
    planSelection: 'Blue Horizon Gold PPO',
    department: 'Engineering',
    errorState: 'Error',
    errorOrWarningIndicator: 'Dependent SSN format failed validation.',
    currentCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Employee + Spouse',
      status: 'Active'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Family',
      status: 'Error'
    },
    submittedData: {
      dependentVerification: 'Uploaded',
      dependentSsn: 'Invalid format',
      relationshipVerified: 'Yes'
    },
    supportingDependents: [
      { id: 'dep-1010-1', name: 'Kai Bennett', relationship: 'Child', dateOfBirth: '2021-06-18' }
    ],
    validationMessages: [
      {
        id: 'val-2006-1',
        severity: 'Error',
        message: 'Dependent SSN format is invalid. Update and resubmit the request.'
      }
    ],
    approvalHistory: [
      { id: 'appr-2006-1', action: 'Submitted', actor: 'Noah Bennett', occurredAt: '2026-03-14T09:54:00Z' },
      { id: 'appr-2006-2', action: 'System Error', actor: 'Enrollment Validation Service', occurredAt: '2026-03-14T09:55:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2006-1',
        action: 'Validation Error',
        actor: 'Enrollment Validation Service',
        occurredAt: '2026-03-14T09:55:00Z',
        details: 'Dependent SSN failed pattern check during enrollment request validation.'
      }
    ]
  },
  {
    id: 'req-2007',
    employeeName: 'Ariana Wells',
    employeeId: 'E-1011',
    requestType: 'Reinstatement',
    submissionDate: '2026-03-05',
    effectiveDate: '2026-03-15',
    status: 'Completed',
    submittedBy: 'Alana Ross (Employer Admin)',
    planSelection: 'Blue Horizon Silver HMO',
    department: 'Operations',
    errorState: 'None',
    processedDate: '2026-03-15',
    processedBy: 'Dana Price (Benefits Admin)',
    currentCoverage: {
      plan: 'No active coverage',
      tier: 'N/A',
      status: 'Terminated'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee Only',
      status: 'Reinstated'
    },
    submittedData: {
      reinstatementReason: 'Payroll correction',
      retroactiveApproval: 'Approved',
      correctionTicket: 'INC-88231'
    },
    supportingDependents: [],
    validationMessages: [],
    approvalHistory: [
      { id: 'appr-2007-1', action: 'Submitted', actor: 'Alana Ross (Employer Admin)', occurredAt: '2026-03-05T13:22:00Z' },
      { id: 'appr-2007-2', action: 'Approved', actor: 'Dana Price (Benefits Admin)', occurredAt: '2026-03-14T10:48:00Z' },
      { id: 'appr-2007-3', action: 'Completed', actor: 'Enrollment Operations', occurredAt: '2026-03-15T06:22:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2007-1',
        action: 'Reinstatement Applied',
        actor: 'Enrollment Operations',
        occurredAt: '2026-03-15T06:22:00Z',
        details: 'Coverage reinstatement posted to billing and eligibility systems.'
      }
    ]
  },
  {
    id: 'req-2008',
    employeeName: 'Ethan Morales',
    employeeId: 'E-1012',
    requestType: 'Open Enrollment Change',
    submissionDate: '2026-03-02',
    effectiveDate: '2026-04-01',
    status: 'Completed',
    submittedBy: 'Ethan Morales',
    planSelection: 'Blue Horizon Gold PPO',
    department: 'Finance',
    errorState: 'None',
    processedDate: '2026-03-10',
    processedBy: 'Benefits Workflow Engine',
    currentCoverage: {
      plan: 'Blue Horizon Bronze HDHP',
      tier: 'Employee Only',
      status: 'Active'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Employee Only',
      status: 'Completed'
    },
    submittedData: {
      reason: 'Open enrollment annual election',
      costDifference: '+$74 monthly',
      ack: 'Accepted'
    },
    supportingDependents: [],
    validationMessages: [],
    approvalHistory: [
      { id: 'appr-2008-1', action: 'Submitted', actor: 'Ethan Morales', occurredAt: '2026-03-02T12:41:00Z' },
      { id: 'appr-2008-2', action: 'Completed', actor: 'Benefits Workflow Engine', occurredAt: '2026-03-10T05:31:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2008-1',
        action: 'Election Completed',
        actor: 'Benefits Workflow Engine',
        occurredAt: '2026-03-10T05:31:00Z',
        details: 'Open enrollment election published to downstream carriers.'
      }
    ]
  },
  {
    id: 'req-2009',
    employeeName: 'Leah Gardner',
    employeeId: 'E-1013',
    requestType: 'New Hire Enrollment',
    submissionDate: '2026-03-06',
    effectiveDate: '2026-04-01',
    status: 'Completed',
    submittedBy: 'Liam Cooper (HR Admin)',
    planSelection: 'Blue Horizon Silver HMO',
    department: 'People Operations',
    errorState: 'None',
    processedDate: '2026-03-12',
    processedBy: 'Dana Price (Benefits Admin)',
    currentCoverage: {
      plan: 'No active coverage',
      tier: 'N/A',
      status: 'Not Enrolled'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee Only',
      status: 'Completed'
    },
    submittedData: {
      hireDate: '2026-03-01',
      waitingPeriodSatisfied: 'Yes',
      onboardingChecklist: 'Complete'
    },
    supportingDependents: [],
    validationMessages: [],
    approvalHistory: [
      { id: 'appr-2009-1', action: 'Submitted', actor: 'Liam Cooper (HR Admin)', occurredAt: '2026-03-06T09:05:00Z' },
      { id: 'appr-2009-2', action: 'Approved', actor: 'Dana Price (Benefits Admin)', occurredAt: '2026-03-11T14:17:00Z' },
      { id: 'appr-2009-3', action: 'Completed', actor: 'Enrollment Operations', occurredAt: '2026-03-12T05:47:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2009-1',
        action: 'New Hire Enrollment Posted',
        actor: 'Enrollment Operations',
        occurredAt: '2026-03-12T05:47:00Z',
        details: 'New hire enrollment activated and member account provisioned.'
      }
    ]
  },
  {
    id: 'req-2010',
    employeeName: 'Mason Hughes',
    employeeId: 'E-1014',
    requestType: 'Qualifying Life Event Change',
    submissionDate: '2026-03-03',
    effectiveDate: '2026-03-15',
    status: 'Rejected',
    submittedBy: 'Mason Hughes',
    planSelection: 'Blue Horizon Gold PPO',
    department: 'Engineering',
    errorState: 'Error',
    errorOrWarningIndicator: 'QLE documentation outside allowable submission window.',
    processedDate: '2026-03-09',
    processedBy: 'Dana Price (Benefits Admin)',
    currentCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Employee + Spouse',
      status: 'Active'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Family',
      status: 'Rejected'
    },
    submittedData: {
      qleReason: 'Birth/Adoption',
      submissionWindow: 'Exceeded',
      appealRequested: 'No'
    },
    supportingDependents: [
      { id: 'dep-1014-1', name: 'Ari Hughes', relationship: 'Child', dateOfBirth: '2025-11-02' }
    ],
    qualifyingLifeEvent: {
      type: 'Birth/Adoption',
      eventDate: '2025-11-02',
      notes: 'Submitted beyond 60-day window for special enrollment period.'
    },
    validationMessages: [
      {
        id: 'val-2010-1',
        severity: 'Error',
        message: 'Submission received outside allowable QLE window.'
      }
    ],
    approvalHistory: [
      { id: 'appr-2010-1', action: 'Submitted', actor: 'Mason Hughes', occurredAt: '2026-03-03T15:34:00Z' },
      { id: 'appr-2010-2', action: 'Rejected', actor: 'Dana Price (Benefits Admin)', occurredAt: '2026-03-09T09:11:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2010-1',
        action: 'QLE Rejected',
        actor: 'Dana Price (Benefits Admin)',
        occurredAt: '2026-03-09T09:11:00Z',
        details: 'QLE change rejected due to expired submission window.'
      }
    ]
  },
  {
    id: 'req-2011',
    employeeName: 'Harper Lee',
    employeeId: 'E-1015',
    requestType: 'Dependent Add',
    submissionDate: '2026-03-07',
    effectiveDate: '2026-04-01',
    status: 'Completed',
    submittedBy: 'Harper Lee',
    planSelection: 'Blue Horizon Gold PPO',
    department: 'Sales',
    errorState: 'None',
    processedDate: '2026-03-13',
    processedBy: 'Enrollment Operations',
    currentCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Employee + Spouse',
      status: 'Active'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Gold PPO',
      tier: 'Family',
      status: 'Completed'
    },
    submittedData: {
      dependentType: 'Child',
      documentationStatus: 'Verified',
      pediatricSelection: 'Assigned'
    },
    supportingDependents: [
      { id: 'dep-1015-1', name: 'Rory Lee', relationship: 'Child', dateOfBirth: '2026-01-04' }
    ],
    validationMessages: [],
    approvalHistory: [
      { id: 'appr-2011-1', action: 'Submitted', actor: 'Harper Lee', occurredAt: '2026-03-07T11:12:00Z' },
      { id: 'appr-2011-2', action: 'Completed', actor: 'Enrollment Operations', occurredAt: '2026-03-13T06:09:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2011-1',
        action: 'Dependent Added',
        actor: 'Enrollment Operations',
        occurredAt: '2026-03-13T06:09:00Z',
        details: 'Dependent add request completed and member roster updated.'
      }
    ]
  },
  {
    id: 'req-2012',
    employeeName: 'Caleb Wright',
    employeeId: 'E-1016',
    requestType: 'Coverage Termination',
    submissionDate: '2026-03-04',
    effectiveDate: '2026-03-31',
    status: 'Completed',
    submittedBy: 'Alana Ross (Employer Admin)',
    planSelection: 'Blue Horizon Silver HMO',
    department: 'Operations',
    errorState: 'None',
    processedDate: '2026-03-11',
    processedBy: 'Dana Price (Benefits Admin)',
    currentCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee Only',
      status: 'Active'
    },
    requestedCoverage: {
      plan: 'Blue Horizon Silver HMO',
      tier: 'Employee Only',
      status: 'Completed Termination'
    },
    submittedData: {
      terminationReason: 'Contract end',
      finalCoverageDate: '2026-03-31',
      cobraNoticeRequired: 'No'
    },
    supportingDependents: [],
    validationMessages: [],
    approvalHistory: [
      { id: 'appr-2012-1', action: 'Submitted', actor: 'Alana Ross (Employer Admin)', occurredAt: '2026-03-04T13:04:00Z' },
      { id: 'appr-2012-2', action: 'Completed', actor: 'Dana Price (Benefits Admin)', occurredAt: '2026-03-11T08:19:00Z' }
    ],
    auditTrail: [
      {
        id: 'audit-2012-1',
        action: 'Termination Completed',
        actor: 'Dana Price (Benefits Admin)',
        occurredAt: '2026-03-11T08:19:00Z',
        details: 'Coverage termination finalized and billing proration calculated.'
      }
    ]
  }
];

function scopeRequestForTenant(
  tenantId: string,
  request: EnrollmentRequestRecord
): EnrollmentRequestRecord {
  const tenantPrefix = tenantId.slice(0, 4).toUpperCase();

  return {
    ...request,
    id: `${tenantId}-${request.id}`,
    employeeId: `${request.employeeId}-${tenantPrefix}`,
    supportingDependents: request.supportingDependents.map((dependent) => ({
      ...dependent,
      id: `${tenantId}-${dependent.id}`
    })),
    validationMessages: request.validationMessages.map((message) => ({ ...message })),
    approvalHistory: request.approvalHistory.map((event) => ({ ...event })),
    auditTrail: request.auditTrail.map((event) => ({ ...event })),
    submittedData: { ...request.submittedData },
    currentCoverage: { ...request.currentCoverage },
    requestedCoverage: { ...request.requestedCoverage },
    qualifyingLifeEvent: request.qualifyingLifeEvent
      ? { ...request.qualifyingLifeEvent }
      : undefined
  };
}

export function getEnrollmentRequestsForTenant(tenantId: string) {
  return baseRequests.map((request) => scopeRequestForTenant(tenantId, request));
}

export function getEnrollmentRequestByIdForTenant(
  tenantId: string,
  requestId: string
) {
  const requests = getEnrollmentRequestsForTenant(tenantId);
  return requests.find((request) => request.id === requestId) ?? null;
}

export function getPendingEnrollmentRequestsForTenant(tenantId: string) {
  const pendingStatuses: EnrollmentRequestStatus[] = [
    'Pending',
    'In Progress',
    'Needs Correction',
    'Error'
  ];

  return getEnrollmentRequestsForTenant(tenantId).filter((request) =>
    pendingStatuses.includes(request.status)
  );
}

export function getEnrollmentHistoryForTenant(tenantId: string) {
  const historyStatuses: EnrollmentRequestStatus[] = [
    'Approved',
    'Rejected',
    'Completed',
    'Error'
  ];

  return getEnrollmentRequestsForTenant(tenantId)
    .filter((request) => historyStatuses.includes(request.status))
    .sort((a, b) => b.submissionDate.localeCompare(a.submissionDate));
}

export function getEnrollmentActivitySummaryForTenant(
  tenantId: string
): EnrollmentActivitySummary {
  const requests = getEnrollmentRequestsForTenant(tenantId);
  const pending = getPendingEnrollmentRequestsForTenant(tenantId);

  const pendingEnrollments = pending.filter(
    (request) => request.requestType !== 'Coverage Termination'
  ).length;
  const pendingTerminations = pending.filter(
    (request) => request.requestType === 'Coverage Termination'
  ).length;
  const pendingLifeEvents = pending.filter(
    (request) => request.requestType === 'Qualifying Life Event Change'
  ).length;
  const changesInProgress = pending.filter((request) =>
    request.status === 'In Progress' || request.status === 'Needs Correction'
  ).length;
  const enrollmentErrors = pending.filter(
    (request) => request.errorState === 'Error' || request.status === 'Error'
  ).length;

  const weekStart = new Date('2026-03-09T00:00:00Z').getTime();
  const weekEnd = new Date('2026-03-16T00:00:00Z').getTime();

  const completedThisWeek = requests.filter((request) => {
    if (!request.processedDate) {
      return false;
    }

    if (!(request.status === 'Completed' || request.status === 'Approved')) {
      return false;
    }

    const processedAt = new Date(`${request.processedDate}T00:00:00Z`).getTime();
    return processedAt >= weekStart && processedAt < weekEnd;
  }).length;

  return {
    pendingEnrollments,
    pendingTerminations,
    pendingLifeEvents,
    changesInProgress,
    enrollmentErrors,
    completedThisWeek
  };
}

export function getEnrollmentRequestFilterOptions(
  requests: EnrollmentRequestRecord[]
) {
  const requestTypes = Array.from(new Set(requests.map((request) => request.requestType))).sort();
  const plans = Array.from(new Set(requests.map((request) => request.planSelection))).sort();
  const departments = Array.from(
    new Set(requests.map((request) => request.department))
  ).sort();

  return {
    requestTypes,
    plans,
    departments
  };
}
