export type EmployerInvoiceStatus = 'Paid' | 'Pending' | 'Overdue';
export type EmployerPaymentStatus = 'Succeeded' | 'Processing' | 'Failed';
export type EmployerBillingStatus =
  | 'Pending Payment'
  | 'Paid in Full'
  | 'Overdue'
  | 'No Balance';

export type EmployerPaymentMethod =
  | 'ACH Bank Transfer'
  | 'Credit Card'
  | 'Wire Transfer';

export type EmployerInvoiceLineItem = {
  id: string;
  category:
    | 'Employee Premiums'
    | 'Dependent Premiums'
    | 'Employer Contribution'
    | 'Employee Contribution'
    | 'Adjustments'
    | 'Credits';
  description: string;
  amount: number;
};

export type EmployerAdjustment = {
  id: string;
  description: string;
  amount: number;
  appliedDate: string;
};

export type EmployerCredit = {
  id: string;
  description: string;
  amount: number;
  appliedDate: string;
};

export type EmployerPaymentRecord = {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  status: EmployerPaymentStatus;
  method: EmployerPaymentMethod;
  confirmationNumber: string;
};

export type EmployerInvoiceRecord = {
  id: string;
  invoiceNumber: string;
  billingPeriod: string;
  billingCycleLabel: string;
  issuedDate: string;
  dueDate: string;
  invoiceAmount: number;
  outstandingBalance: number;
  status: EmployerInvoiceStatus;
  paymentStatus: EmployerPaymentStatus | 'Unpaid';
  paymentMethod?: EmployerPaymentMethod;
  paymentDate?: string;
  employerName: string;
  employerAddress: string;
  lineItems: EmployerInvoiceLineItem[];
  adjustments: EmployerAdjustment[];
  credits: EmployerCredit[];
};

export type EmployerBillingSummary = {
  currentInvoiceAmount: number;
  invoiceDueDate: string;
  outstandingBalance: number;
  lastPaymentAmount: number;
  lastPaymentDate: string;
  billingStatus: EmployerBillingStatus;
};

export type EmployerBillingDataset = {
  tenantId: string;
  employerName: string;
  currentBillingCycle: string;
  invoices: EmployerInvoiceRecord[];
  payments: EmployerPaymentRecord[];
  summary: EmployerBillingSummary;
};

export type EmployerBillingAlignment = {
  currentInvoiceAmount?: number;
  invoiceDueDate?: string | null;
  outstandingBalance?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: string | null;
  billingStatus?: EmployerBillingStatus | string;
};

const baseInvoices: EmployerInvoiceRecord[] = [
  {
    id: 'inv-3001',
    invoiceNumber: 'INV-2026-03',
    billingPeriod: 'Mar 2026',
    billingCycleLabel: 'March 1 - March 31, 2026',
    issuedDate: '2026-03-01',
    dueDate: '2026-03-30',
    invoiceAmount: 214832,
    outstandingBalance: 5922,
    status: 'Pending',
    paymentStatus: 'Processing',
    paymentMethod: 'ACH Bank Transfer',
    paymentDate: '2026-03-28',
    employerName: 'Blue Horizon Health',
    employerAddress: '1200 Jefferson Ave, Detroit, MI 48226',
    lineItems: [
      { id: 'line-3001-1', category: 'Employee Premiums', description: 'Employee medical premium aggregate', amount: 132480 },
      { id: 'line-3001-2', category: 'Dependent Premiums', description: 'Dependent medical premium aggregate', amount: 82420 },
      { id: 'line-3001-3', category: 'Employer Contribution', description: 'Employer contribution allocation', amount: -145800 },
      { id: 'line-3001-4', category: 'Employee Contribution', description: 'Employee payroll contribution offset', amount: -56910 },
      { id: 'line-3001-5', category: 'Adjustments', description: 'Retro rate correction', amount: 11920 },
      { id: 'line-3001-6', category: 'Credits', description: 'Prior cycle credit applied', amount: -9278 }
    ],
    adjustments: [
      { id: 'adj-3001-1', description: 'Retro enrollment correction', amount: 8174, appliedDate: '2026-03-12' },
      { id: 'adj-3001-2', description: 'Late dependent add', amount: 3746, appliedDate: '2026-03-19' }
    ],
    credits: [
      { id: 'cr-3001-1', description: 'Overpayment carry forward', amount: 9278, appliedDate: '2026-03-01' }
    ]
  },
  {
    id: 'inv-3002',
    invoiceNumber: 'INV-2026-02',
    billingPeriod: 'Feb 2026',
    billingCycleLabel: 'February 1 - February 29, 2026',
    issuedDate: '2026-02-01',
    dueDate: '2026-02-28',
    invoiceAmount: 208910,
    outstandingBalance: 0,
    status: 'Paid',
    paymentStatus: 'Succeeded',
    paymentMethod: 'ACH Bank Transfer',
    paymentDate: '2026-02-28',
    employerName: 'Blue Horizon Health',
    employerAddress: '1200 Jefferson Ave, Detroit, MI 48226',
    lineItems: [
      { id: 'line-3002-1', category: 'Employee Premiums', description: 'Employee medical premium aggregate', amount: 129104 },
      { id: 'line-3002-2', category: 'Dependent Premiums', description: 'Dependent medical premium aggregate', amount: 80112 },
      { id: 'line-3002-3', category: 'Employer Contribution', description: 'Employer contribution allocation', amount: -142900 },
      { id: 'line-3002-4', category: 'Employee Contribution', description: 'Employee payroll contribution offset', amount: -54220 },
      { id: 'line-3002-5', category: 'Adjustments', description: 'Prior billing true-up', amount: 6540 },
      { id: 'line-3002-6', category: 'Credits', description: 'Early payment credit', amount: -9626 }
    ],
    adjustments: [
      { id: 'adj-3002-1', description: 'Retro term adjustment', amount: 6540, appliedDate: '2026-02-09' }
    ],
    credits: [
      { id: 'cr-3002-1', description: 'Early payment credit', amount: 9626, appliedDate: '2026-02-20' }
    ]
  },
  {
    id: 'inv-3003',
    invoiceNumber: 'INV-2026-01',
    billingPeriod: 'Jan 2026',
    billingCycleLabel: 'January 1 - January 31, 2026',
    issuedDate: '2026-01-01',
    dueDate: '2026-01-30',
    invoiceAmount: 206740,
    outstandingBalance: 0,
    status: 'Paid',
    paymentStatus: 'Succeeded',
    paymentMethod: 'Wire Transfer',
    paymentDate: '2026-01-29',
    employerName: 'Blue Horizon Health',
    employerAddress: '1200 Jefferson Ave, Detroit, MI 48226',
    lineItems: [
      { id: 'line-3003-1', category: 'Employee Premiums', description: 'Employee medical premium aggregate', amount: 128640 },
      { id: 'line-3003-2', category: 'Dependent Premiums', description: 'Dependent medical premium aggregate', amount: 79312 },
      { id: 'line-3003-3', category: 'Employer Contribution', description: 'Employer contribution allocation', amount: -141850 },
      { id: 'line-3003-4', category: 'Employee Contribution', description: 'Employee payroll contribution offset', amount: -53720 },
      { id: 'line-3003-5', category: 'Adjustments', description: 'Year start adjustment', amount: 6210 },
      { id: 'line-3003-6', category: 'Credits', description: 'Plan migration credit', amount: -7852 }
    ],
    adjustments: [
      { id: 'adj-3003-1', description: 'Migration rate alignment', amount: 6210, appliedDate: '2026-01-07' }
    ],
    credits: [
      { id: 'cr-3003-1', description: 'Plan migration credit', amount: 7852, appliedDate: '2026-01-15' }
    ]
  },
  {
    id: 'inv-3004',
    invoiceNumber: 'INV-2025-12',
    billingPeriod: 'Dec 2025',
    billingCycleLabel: 'December 1 - December 31, 2025',
    issuedDate: '2025-12-01',
    dueDate: '2025-12-30',
    invoiceAmount: 205904,
    outstandingBalance: 2210,
    status: 'Overdue',
    paymentStatus: 'Failed',
    paymentMethod: 'Credit Card',
    paymentDate: '2025-12-30',
    employerName: 'Blue Horizon Health',
    employerAddress: '1200 Jefferson Ave, Detroit, MI 48226',
    lineItems: [
      { id: 'line-3004-1', category: 'Employee Premiums', description: 'Employee medical premium aggregate', amount: 127880 },
      { id: 'line-3004-2', category: 'Dependent Premiums', description: 'Dependent medical premium aggregate', amount: 78910 },
      { id: 'line-3004-3', category: 'Employer Contribution', description: 'Employer contribution allocation', amount: -141110 },
      { id: 'line-3004-4', category: 'Employee Contribution', description: 'Employee payroll contribution offset', amount: -53544 },
      { id: 'line-3004-5', category: 'Adjustments', description: 'Coverage tier correction', amount: 7440 },
      { id: 'line-3004-6', category: 'Credits', description: 'Appeal credit', amount: -3672 }
    ],
    adjustments: [
      { id: 'adj-3004-1', description: 'Coverage tier correction', amount: 7440, appliedDate: '2025-12-18' }
    ],
    credits: [
      { id: 'cr-3004-1', description: 'Appeal credit', amount: 3672, appliedDate: '2025-12-24' }
    ]
  }
];

const basePayments: EmployerPaymentRecord[] = [
  {
    id: 'pay-3001',
    invoiceId: 'inv-3001',
    amount: 208910,
    paymentDate: '2026-03-28',
    status: 'Processing',
    method: 'ACH Bank Transfer',
    confirmationNumber: 'ACH-882194'
  },
  {
    id: 'pay-3002',
    invoiceId: 'inv-3002',
    amount: 208910,
    paymentDate: '2026-02-28',
    status: 'Succeeded',
    method: 'ACH Bank Transfer',
    confirmationNumber: 'ACH-874220'
  },
  {
    id: 'pay-3003',
    invoiceId: 'inv-3003',
    amount: 206740,
    paymentDate: '2026-01-29',
    status: 'Succeeded',
    method: 'Wire Transfer',
    confirmationNumber: 'WIRE-443102'
  },
  {
    id: 'pay-3004',
    invoiceId: 'inv-3004',
    amount: 203694,
    paymentDate: '2025-12-30',
    status: 'Failed',
    method: 'Credit Card',
    confirmationNumber: 'CC-661902'
  }
];

function scopedInvoice(tenantId: string, employerName: string, invoice: EmployerInvoiceRecord) {
  return {
    ...invoice,
    id: `${tenantId}-${invoice.id}`,
    invoiceNumber: `${invoice.invoiceNumber}-${tenantId.slice(0, 4).toUpperCase()}`,
    employerName,
    lineItems: invoice.lineItems.map((lineItem) => ({ ...lineItem })),
    adjustments: invoice.adjustments.map((adjustment) => ({ ...adjustment })),
    credits: invoice.credits.map((credit) => ({ ...credit }))
  };
}

function scopedPayment(tenantId: string, payment: EmployerPaymentRecord) {
  return {
    ...payment,
    id: `${tenantId}-${payment.id}`,
    invoiceId: `${tenantId}-${payment.invoiceId}`
  };
}

function toBillingStatus(invoice: EmployerInvoiceRecord): EmployerBillingStatus {
  if (invoice.outstandingBalance <= 0) {
    return 'Paid in Full';
  }

  if (invoice.status === 'Overdue') {
    return 'Overdue';
  }

  return 'Pending Payment';
}

function normalizeBillingStatus(value: EmployerBillingAlignment['billingStatus']) {
  if (!value) {
    return undefined;
  }
  if (value === 'Pending Payment' || value === 'Paid in Full' || value === 'Overdue' || value === 'No Balance') {
    return value;
  }
  if (value === 'Current') {
    return 'Paid in Full';
  }
  return undefined;
}

function mapSummaryStatusToInvoiceStatus(status: EmployerBillingStatus): EmployerInvoiceStatus {
  if (status === 'Overdue') {
    return 'Overdue';
  }
  if (status === 'Paid in Full' || status === 'No Balance') {
    return 'Paid';
  }
  return 'Pending';
}

function mapSummaryStatusToPaymentStatus(status: EmployerBillingStatus): EmployerPaymentStatus | 'Unpaid' {
  if (status === 'Overdue') {
    return 'Failed';
  }
  if (status === 'Paid in Full' || status === 'No Balance') {
    return 'Succeeded';
  }
  return 'Processing';
}

export function getEmployerBillingDatasetForTenant(
  tenantId: string,
  employerName = 'Employer',
  alignment?: EmployerBillingAlignment
): EmployerBillingDataset {
  const invoices = baseInvoices.map((invoice) => scopedInvoice(tenantId, employerName, invoice));
  const payments = basePayments.map((payment) => scopedPayment(tenantId, payment));

  const currentInvoice = invoices[0] ? { ...invoices[0] } : undefined;
  const alignedStatus = normalizeBillingStatus(alignment?.billingStatus);

  if (currentInvoice && alignment) {
    currentInvoice.invoiceAmount = alignment.currentInvoiceAmount ?? currentInvoice.invoiceAmount;
    currentInvoice.outstandingBalance = alignment.outstandingBalance ?? currentInvoice.outstandingBalance;
    if (alignment.invoiceDueDate) {
      currentInvoice.dueDate = alignment.invoiceDueDate;
    }

    const normalized = alignedStatus ?? toBillingStatus(currentInvoice);
    currentInvoice.status = mapSummaryStatusToInvoiceStatus(normalized);
    currentInvoice.paymentStatus = mapSummaryStatusToPaymentStatus(normalized);
  }

  const alignedInvoices = currentInvoice ? [currentInvoice, ...invoices.slice(1)] : invoices;
  const alignedPayments = payments.map((payment) => ({ ...payment }));
  if (alignedPayments[0] && alignment) {
    alignedPayments[0].amount = alignment.lastPaymentAmount ?? alignedPayments[0].amount;
    if (alignment.lastPaymentDate) {
      alignedPayments[0].paymentDate = alignment.lastPaymentDate;
    }
  }

  const successfulPayments = alignedPayments
    .filter((payment) => payment.status === 'Succeeded')
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

  const lastPayment = successfulPayments[0] ?? alignedPayments[0];

  return {
    tenantId,
    employerName,
    currentBillingCycle: currentInvoice?.billingCycleLabel ?? 'No active billing cycle',
    invoices: alignedInvoices,
    payments: alignedPayments,
    summary: {
      currentInvoiceAmount: alignment?.currentInvoiceAmount ?? currentInvoice?.invoiceAmount ?? 0,
      invoiceDueDate: alignment?.invoiceDueDate ?? currentInvoice?.dueDate ?? '',
      outstandingBalance: alignment?.outstandingBalance ?? currentInvoice?.outstandingBalance ?? 0,
      lastPaymentAmount: alignment?.lastPaymentAmount ?? lastPayment?.amount ?? 0,
      lastPaymentDate: alignment?.lastPaymentDate ?? lastPayment?.paymentDate ?? '',
      billingStatus: alignedStatus ?? (currentInvoice ? toBillingStatus(currentInvoice) : 'No Balance')
    }
  };
}

export function getEmployerInvoiceByIdForTenant(
  tenantId: string,
  invoiceId: string,
  employerName?: string,
  alignment?: EmployerBillingAlignment
) {
  const dataset = getEmployerBillingDatasetForTenant(tenantId, employerName, alignment);
  return dataset.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
}

export function getCurrentEmployerInvoiceForTenant(
  tenantId: string,
  employerName?: string,
  alignment?: EmployerBillingAlignment
) {
  const dataset = getEmployerBillingDatasetForTenant(tenantId, employerName, alignment);
  return dataset.invoices[0] ?? null;
}

export function toInvoiceCsv(invoices: EmployerInvoiceRecord[]) {
  const rows = [
    ['Invoice Number', 'Billing Period', 'Invoice Amount', 'Due Date', 'Status', 'Payment Method', 'Payment Date', 'Outstanding Balance'],
    ...invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.billingPeriod,
      String(invoice.invoiceAmount),
      invoice.dueDate,
      invoice.status,
      invoice.paymentMethod ?? '',
      invoice.paymentDate ?? '',
      String(invoice.outstandingBalance)
    ])
  ];

  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}
