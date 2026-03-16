export type DocumentCategory =
  | 'Plan Documents'
  | 'Billing Documents'
  | 'Compliance Documents'
  | 'Employer Documents'
  | 'Secure File Exchange';

export type DocumentType =
  | 'Summary of Benefits and Coverage'
  | 'Plan Guide'
  | 'Benefit Highlights'
  | 'Coverage Details'
  | 'Monthly Invoice'
  | 'Payment Statement'
  | 'Billing Adjustment'
  | 'ACA Notice'
  | 'Coverage Notice'
  | 'Eligibility Documentation'
  | 'COBRA Notice'
  | 'Employer Agreement'
  | 'Policy Document'
  | 'Custom Employer File'
  | 'Eligibility Correction'
  | 'Enrollment Documentation'
  | 'Compliance Submission'
  | 'Life Event Supporting Document';

export type DocumentStatus = 'Available' | 'Pending Processing' | 'Expired';

export type EmployerDocumentRecord = {
  id: string;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  uploadDate: string;
  effectiveDate?: string;
  expirationDate?: string;
  uploadedBy: string;
  version: string;
  status: DocumentStatus;
  description?: string;
  associatedEmployee?: string;
};

export type DocumentCenterAlignment = {
  recentDocumentsCount?: number;
  planDocuments?: number;
  billingStatements?: number;
  complianceNotices?: number;
  secureFileExchange?: number;
};

const baseDocuments: EmployerDocumentRecord[] = [
  {
    id: 'doc-5001',
    name: 'Summary of Benefits and Coverage 2026',
    type: 'Summary of Benefits and Coverage',
    category: 'Plan Documents',
    uploadDate: '2026-01-03',
    effectiveDate: '2026-01-01',
    expirationDate: '2026-12-31',
    uploadedBy: 'Benefits Administration',
    version: 'v3.0',
    status: 'Available'
  },
  {
    id: 'doc-5002',
    name: 'Employer Plan Guide 2026',
    type: 'Plan Guide',
    category: 'Plan Documents',
    uploadDate: '2026-01-05',
    effectiveDate: '2026-01-01',
    expirationDate: '2026-12-31',
    uploadedBy: 'Benefits Administration',
    version: 'v2.1',
    status: 'Available'
  },
  {
    id: 'doc-5003',
    name: 'March 2026 Monthly Invoice',
    type: 'Monthly Invoice',
    category: 'Billing Documents',
    uploadDate: '2026-03-01',
    effectiveDate: '2026-03-01',
    expirationDate: '2027-03-01',
    uploadedBy: 'Billing Operations',
    version: 'v1.0',
    status: 'Available'
  },
  {
    id: 'doc-5004',
    name: 'February Payment Statement',
    type: 'Payment Statement',
    category: 'Billing Documents',
    uploadDate: '2026-02-28',
    effectiveDate: '2026-02-01',
    expirationDate: '2027-02-28',
    uploadedBy: 'Billing Operations',
    version: 'v1.0',
    status: 'Available'
  },
  {
    id: 'doc-5005',
    name: 'ACA Compliance Notice Q1',
    type: 'ACA Notice',
    category: 'Compliance Documents',
    uploadDate: '2026-03-10',
    effectiveDate: '2026-03-15',
    expirationDate: '2026-06-30',
    uploadedBy: 'Compliance Team',
    version: 'v1.1',
    status: 'Available'
  },
  {
    id: 'doc-5006',
    name: 'Coverage Eligibility Verification',
    type: 'Eligibility Documentation',
    category: 'Compliance Documents',
    uploadDate: '2026-03-08',
    effectiveDate: '2026-03-08',
    expirationDate: '2026-09-30',
    uploadedBy: 'Compliance Team',
    version: 'v1.0',
    status: 'Pending Processing'
  },
  {
    id: 'doc-5007',
    name: 'Employer Master Agreement',
    type: 'Employer Agreement',
    category: 'Employer Documents',
    uploadDate: '2025-12-15',
    effectiveDate: '2026-01-01',
    expirationDate: '2028-12-31',
    uploadedBy: 'Employer Contracting',
    version: 'v5.2',
    status: 'Available'
  },
  {
    id: 'doc-5008',
    name: 'Custom Eligibility Audit File',
    type: 'Custom Employer File',
    category: 'Employer Documents',
    uploadDate: '2026-03-09',
    effectiveDate: '2026-03-09',
    expirationDate: '2026-04-30',
    uploadedBy: 'Alana Ross (Employer Admin)',
    version: 'v1.0',
    status: 'Available'
  },
  {
    id: 'doc-5009',
    name: 'Life Event Supporting Docs - Shah',
    type: 'Life Event Supporting Document',
    category: 'Secure File Exchange',
    uploadDate: '2026-03-13',
    effectiveDate: '2026-03-13',
    uploadedBy: 'Nina Patel (HR Specialist)',
    version: 'v1.0',
    status: 'Pending Processing',
    associatedEmployee: 'Priya Shah',
    description: 'Marriage certificate package for QLE processing.'
  },
  {
    id: 'doc-5010',
    name: 'Enrollment Correction Submission - Torres',
    type: 'Enrollment Documentation',
    category: 'Secure File Exchange',
    uploadDate: '2026-03-15',
    effectiveDate: '2026-03-15',
    uploadedBy: 'Elena Torres',
    version: 'v1.0',
    status: 'Available',
    associatedEmployee: 'Elena Torres',
    description: 'Updated attestation form and supporting correction docs.'
  },
  {
    id: 'doc-5011',
    name: 'Coverage Notice 2025 Archive',
    type: 'Coverage Notice',
    category: 'Compliance Documents',
    uploadDate: '2025-05-01',
    effectiveDate: '2025-05-01',
    expirationDate: '2026-01-15',
    uploadedBy: 'Compliance Team',
    version: 'v1.4',
    status: 'Expired'
  }
];

function scopeDocuments(tenantId: string) {
  const prefix = tenantId.slice(0, 4).toUpperCase();
  return baseDocuments.map((document) => ({
    ...document,
    id: `${tenantId}-${document.id}`,
    version: `${document.version}-${prefix}`
  }));
}

function expandCategoryDocuments(
  source: EmployerDocumentRecord[],
  targetCount: number
) {
  if (targetCount <= source.length) {
    return source.slice(0, targetCount);
  }

  if (source.length === 0) {
    return [];
  }

  const expanded = [...source];
  let counter = 1;
  while (expanded.length < targetCount) {
    const template = source[counter % source.length];
    expanded.push({
      ...template,
      id: `${template.id}-aligned-${counter}`,
      name: `${template.name} (${counter + 1})`,
      version: `${template.version}.${counter}`
    });
    counter += 1;
  }

  return expanded;
}

export function getEmployerDocumentsForTenant(tenantId: string, alignment?: DocumentCenterAlignment) {
  const scoped = scopeDocuments(tenantId);
  if (!alignment) {
    return scoped;
  }

  const planDocuments = expandCategoryDocuments(
    scoped.filter((document) => document.category === 'Plan Documents'),
    alignment.planDocuments ?? scoped.filter((document) => document.category === 'Plan Documents').length
  );
  const billingDocuments = expandCategoryDocuments(
    scoped.filter((document) => document.category === 'Billing Documents'),
    alignment.billingStatements ?? scoped.filter((document) => document.category === 'Billing Documents').length
  );
  const complianceDocuments = expandCategoryDocuments(
    scoped.filter((document) => document.category === 'Compliance Documents'),
    alignment.complianceNotices ?? scoped.filter((document) => document.category === 'Compliance Documents').length
  );
  const employerDocuments = scoped.filter((document) => document.category === 'Employer Documents');
  const secureDocuments = expandCategoryDocuments(
    scoped.filter((document) => document.category === 'Secure File Exchange'),
    alignment.secureFileExchange ?? scoped.filter((document) => document.category === 'Secure File Exchange').length
  );

  return [
    ...planDocuments,
    ...billingDocuments,
    ...complianceDocuments,
    ...employerDocuments,
    ...secureDocuments
  ];
}

export function getEmployerDocumentByIdForTenant(tenantId: string, documentId: string, alignment?: DocumentCenterAlignment) {
  return getEmployerDocumentsForTenant(tenantId, alignment).find((document) => document.id === documentId) ?? null;
}

export function getRecentDocumentsForTenant(tenantId: string, limit = 5, alignment?: DocumentCenterAlignment) {
  const targetLimit =
    alignment?.recentDocumentsCount !== undefined
      ? Math.min(limit, Math.max(alignment.recentDocumentsCount, 0))
      : limit;

  return [...getEmployerDocumentsForTenant(tenantId, alignment)]
    .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
    .slice(0, targetLimit);
}

export function getDocumentCenterSummaryForTenant(tenantId: string, alignment?: DocumentCenterAlignment) {
  const documents = getEmployerDocumentsForTenant(tenantId, alignment);
  const recentDocuments = getRecentDocumentsForTenant(tenantId, 5, alignment);

  return {
    recentDocumentsCount: recentDocuments.length,
    planDocuments: documents.filter((document) => document.category === 'Plan Documents').length,
    billingStatements: documents.filter((document) => document.category === 'Billing Documents').length,
    complianceNotices: documents.filter((document) => document.category === 'Compliance Documents').length,
    secureFileExchange: documents.filter((document) => document.category === 'Secure File Exchange').length
  };
}

export function getDocumentFilterOptions(documents: EmployerDocumentRecord[]) {
  return {
    categories: Array.from(new Set(documents.map((document) => document.category))).sort(),
    types: Array.from(new Set(documents.map((document) => document.type))).sort()
  };
}

export function documentsToCsv(documents: EmployerDocumentRecord[]) {
  const rows = [
    ['Document Name', 'Document Type', 'Category', 'Upload Date', 'Effective Date', 'Expiration Date', 'Uploaded By', 'Version', 'Status'],
    ...documents.map((document) => [
      document.name,
      document.type,
      document.category,
      document.uploadDate,
      document.effectiveDate ?? '',
      document.expirationDate ?? '',
      document.uploadedBy,
      document.version,
      document.status
    ])
  ];

  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}
