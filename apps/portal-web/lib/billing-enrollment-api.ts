export type BillingEnrollmentOverview = {
  enrollmentCases: Array<Record<string, unknown>>;
  planCatalog: Array<Record<string, unknown>>;
  eligibilityRules: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  documentRequirements: Array<Record<string, unknown>>;
  renewalsAndLifeEvents: Array<Record<string, unknown>>;
  notices: Array<Record<string, unknown>>;
};

export type BillingSummaryResponse = {
  billingAccount: {
    id: string;
    tenantId: string;
    accountNumber: string;
    currentBalance: number;
    currency: 'USD';
    status: 'active' | 'delinquent' | 'suspended';
  };
  currentBalance: number;
  nextInvoice: {
    id: string;
    billingAccountId: string;
    issuedDate: string;
    dueDate: string;
    effectiveDate: string;
    amountDue: number;
    status: 'issued' | 'due' | 'paid' | 'posted' | 'past_due';
    lines: Array<{
      id: string;
      description: string;
      amount: number;
      category: 'premium' | 'adjustment' | 'fee' | 'credit';
    }>;
  };
  paymentHistory: Array<{
    id: string;
    invoiceId: string;
    billingAccountId: string;
    amount: number;
    initiatedAt: string;
    status: 'initiated' | 'processing' | 'succeeded' | 'failed' | 'posted';
    methodLabel: string;
  }>;
  paymentMethods: Array<{
    id: string;
    type: 'card' | 'bank_account';
    brand?: string;
    maskedLabel: string;
    defaultMethod: boolean;
    expiresAt?: string;
  }>;
  autopay: {
    id: string;
    billingAccountId: string;
    enabled: boolean;
    paymentMethodTokenId?: string;
    nextRunDate?: string;
  };
  delinquency: {
    isDelinquent: boolean;
    daysPastDue: number;
    level: 'none' | 'warning' | 'critical';
  };
  gracePeriod: {
    active: boolean;
    startDate?: string;
    endDate?: string;
  };
  statements: Array<{
    id: string;
    title: string;
    kind: 'statement' | 'tax_document';
    period: string;
    downloadable: boolean;
    downloadHref: string;
  }>;
  refundsAndReversals: Array<{
    id: string;
    paymentId: string;
    type: 'refund' | 'reversal';
    amount: number;
    reason: string;
    createdAt: string;
  }>;
};

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3002';

export async function getBillingEnrollmentOverview(userId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/overview`, {
    cache: 'no-store',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to load Billing & Enrollment overview.');
  }

  return (await response.json()) as BillingEnrollmentOverview;
}

export async function startBillingEnrollment(userId: string, input: { householdId: string; planId: string; effectiveDate: string }) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/enrollments/start`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to start enrollment workflow.');
  }

  return response.json();
}

export async function getBillingEnrollmentPlans(userId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/plans`, {
    cache: 'no-store',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to load plan catalog.');
  }

  return response.json();
}

export async function compareBillingEnrollmentPlans(userId: string, input: { planIds: string[] }) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/plans/compare`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to compare plans.');
  }

  return response.json();
}

export async function getBillingSummary(userId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/billing/summary`, {
    cache: 'no-store',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to load billing summary.');
  }

  return (await response.json()) as BillingSummaryResponse;
}

export async function getInvoiceDetail(userId: string, invoiceId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/billing/invoices/${invoiceId}`, {
    cache: 'no-store',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to load invoice details.');
  }

  return response.json();
}

export async function makeBillingPayment(
  userId: string,
  input: { billingAccountId: string; invoiceId: string; paymentMethodTokenId: string; amount: number }
) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/billing/payments/make`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to process payment.');
  }

  return response.json();
}

export async function updateBillingAutopay(
  userId: string,
  input: { enabled: boolean; paymentMethodTokenId?: string }
) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/billing/autopay`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to update autopay.');
  }

  return response.json();
}

export async function getDependentsExperience(userId: string, householdId = 'hh-8843') {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/dependents?householdId=${encodeURIComponent(householdId)}`, {
    cache: 'no-store',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to load dependents.');
  }

  return response.json();
}

export async function addDependent(
  userId: string,
  input: {
    householdId: string;
    firstName: string;
    lastName: string;
    dob: string;
    relationship: 'spouse' | 'child' | 'other';
    relationshipDetail: string;
  }
) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/dependents`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to add dependent.');
  }

  return response.json();
}

export async function updateDependent(
  userId: string,
  dependentId: string,
  input: {
    householdId: string;
    firstName: string;
    lastName: string;
    dob: string;
    relationship: 'spouse' | 'child' | 'other';
    relationshipDetail: string;
  }
) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/dependents/${dependentId}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to update dependent.');
  }

  return response.json();
}

export async function removeDependent(userId: string, dependentId: string, householdId = 'hh-8843') {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/billing-enrollment/dependents/${dependentId}?householdId=${encodeURIComponent(householdId)}`,
    {
      method: 'DELETE',
      headers: {
        'x-user-id': userId
      }
    }
  );

  if (!response.ok) {
    throw new Error('Unable to remove dependent.');
  }

  return response.json();
}

export async function getDocumentCenter(userId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/documents`, {
    cache: 'no-store',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to load documents.');
  }

  return response.json();
}

export async function uploadDocument(
  userId: string,
  input: { requestId: string; documentName: string }
) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/documents/upload`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Unable to upload document.');
  }

  return response.json();
}

export async function getCorrespondenceCenter(userId: string, unreadOnly = false) {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/billing-enrollment/notices/correspondence?unreadOnly=${String(unreadOnly)}`,
    {
      cache: 'no-store',
      headers: {
        'x-user-id': userId
      }
    }
  );

  if (!response.ok) {
    throw new Error('Unable to load notices.');
  }

  return response.json();
}

export async function getNoticeDetail(userId: string, noticeId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/notices/correspondence/${noticeId}`, {
    cache: 'no-store',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to load notice detail.');
  }

  return response.json();
}

export async function markNoticeRead(userId: string, noticeId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/notices/correspondence/${noticeId}/read`, {
    method: 'POST',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to update notice state.');
  }

  return response.json();
}

export async function getSupportCenter(userId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/support`, {
    cache: 'no-store',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to load support center.');
  }

  return response.json();
}

export async function getBillingEnrollmentModuleConfig(userId: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/billing-enrollment/module-config`, {
    cache: 'no-store',
    headers: {
      'x-user-id': userId
    }
  });

  if (!response.ok) {
    throw new Error('Unable to load billing enrollment module configuration.');
  }

  return response.json();
}
