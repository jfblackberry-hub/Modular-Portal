import { getEmployerCensusRecordsForTenant } from './employer-census-data';

export type EmploymentStatusValue = 'Active' | 'Terminated' | 'Leave of Absence' | 'Cobra';
export type CoverageEligibilityValue = 'Eligible' | 'Ineligible' | 'Pending';

export type CensusImportRow = {
  rowNumber: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  hireDate: string;
  employmentStatus: EmploymentStatusValue | string;
  department: string;
  coverageEligibilityStatus: CoverageEligibilityValue | string;
  email?: string;
  phone?: string;
  address?: string;
  dependentCount?: number;
  planEligibilityGroup?: string;
};

export type CensusValidationError = {
  rowNumber: number;
  employeeId: string;
  message: string;
};

export type CensusImportStatus =
  | 'Completed'
  | 'Completed with Warnings'
  | 'Failed'
  | 'Processing'
  | 'Partially Successful';

export type CensusImportBatch = {
  id: string;
  importDate: string;
  fileName: string;
  totalRecords: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsRejected: number;
  importStatus: CensusImportStatus;
  rows: CensusImportRow[];
  validationErrors: CensusValidationError[];
};

export type HrisConnectorProvider =
  | 'Workday'
  | 'ADP'
  | 'BambooHR'
  | 'Rippling'
  | 'SAP SuccessFactors';

export type HrisConnector = {
  id: string;
  provider: HrisConnectorProvider;
  status: 'Not Configured' | 'Configured' | 'Sync Error';
  lastSyncDate?: string;
  syncFrequency: 'Daily' | 'Weekly' | 'Manual';
  notes: string;
};

export type CensusValidationResult = {
  rowsProcessed: number;
  validRecords: number;
  errorCount: number;
  errors: CensusValidationError[];
  newEmployees: CensusImportRow[];
  updatedEmployees: CensusImportRow[];
  unchangedRecords: CensusImportRow[];
  errorRows: CensusImportRow[];
};

export type HrisImportAlignment = {
  lastImportDate?: string | null;
  lastImportStatus?: string | null;
  employeesAdded?: number;
  employeesUpdated?: number;
  importErrors?: number;
};

const employmentStatusValues = new Set(['active', 'terminated', 'leave of absence', 'cobra']);
const coverageEligibilityValues = new Set(['eligible', 'ineligible', 'pending']);

const seedImports: CensusImportBatch[] = [
  {
    id: 'import-3001',
    importDate: '2026-03-14',
    fileName: 'blue-horizon-census-2026-03-14.csv',
    totalRecords: 512,
    recordsAdded: 12,
    recordsUpdated: 4,
    recordsRejected: 2,
    importStatus: 'Completed with Warnings',
    rows: [],
    validationErrors: [
      {
        rowNumber: 88,
        employeeId: 'E-5578',
        message: 'Invalid employment status value: Actve'
      },
      {
        rowNumber: 142,
        employeeId: 'E-5589',
        message: 'Duplicate employee ID in file: E-5589'
      }
    ]
  },
  {
    id: 'import-3002',
    importDate: '2026-02-14',
    fileName: 'blue-horizon-census-2026-02-14.xlsx',
    totalRecords: 505,
    recordsAdded: 9,
    recordsUpdated: 6,
    recordsRejected: 0,
    importStatus: 'Completed',
    rows: [],
    validationErrors: []
  },
  {
    id: 'import-3003',
    importDate: '2026-01-15',
    fileName: 'blue-horizon-census-2026-01-15.csv',
    totalRecords: 498,
    recordsAdded: 18,
    recordsUpdated: 2,
    recordsRejected: 5,
    importStatus: 'Partially Successful',
    rows: [],
    validationErrors: [
      {
        rowNumber: 4,
        employeeId: 'E-5402',
        message: 'Missing required field: Date of Birth'
      },
      {
        rowNumber: 12,
        employeeId: 'E-5409',
        message: 'Invalid date format for Hire Date: 2026/13/01'
      }
    ]
  }
];

const connectorSeeds: HrisConnector[] = [
  {
    id: 'connector-workday',
    provider: 'Workday',
    status: 'Configured',
    lastSyncDate: '2026-03-14',
    syncFrequency: 'Daily',
    notes: 'Primary source for active employee census.'
  },
  {
    id: 'connector-adp',
    provider: 'ADP',
    status: 'Not Configured',
    syncFrequency: 'Manual',
    notes: 'Payroll sync placeholder.'
  },
  {
    id: 'connector-bamboohr',
    provider: 'BambooHR',
    status: 'Not Configured',
    syncFrequency: 'Manual',
    notes: 'SMB HRIS connector placeholder.'
  },
  {
    id: 'connector-rippling',
    provider: 'Rippling',
    status: 'Sync Error',
    lastSyncDate: '2026-03-08',
    syncFrequency: 'Weekly',
    notes: 'Connector configured but token renewal is required.'
  },
  {
    id: 'connector-sap-successfactors',
    provider: 'SAP SuccessFactors',
    status: 'Not Configured',
    syncFrequency: 'Manual',
    notes: 'Enterprise connector placeholder.'
  }
];

function cloneImportBatch(batch: CensusImportBatch): CensusImportBatch {
  return {
    ...batch,
    rows: batch.rows.map((row) => ({ ...row })),
    validationErrors: batch.validationErrors.map((error) => ({ ...error }))
  };
}

function cloneConnector(connector: HrisConnector): HrisConnector {
  return { ...connector };
}

function hasIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp);
}

function isMissing(value: unknown) {
  return value === null || value === undefined || String(value).trim() === '';
}

export function parseCsvRows(csvText: string): CensusImportRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const header = lines[0].split(',').map((item) => item.trim());
  const rows: CensusImportRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = lines[index].split(',').map((item) => item.trim());
    const record = Object.fromEntries(header.map((column, columnIndex) => [column, values[columnIndex] ?? '']));

    rows.push({
      rowNumber: index + 1,
      employeeId: record['Employee ID'] ?? '',
      firstName: record['First Name'] ?? '',
      lastName: record['Last Name'] ?? '',
      dateOfBirth: record['Date of Birth'] ?? '',
      hireDate: record['Hire Date'] ?? '',
      employmentStatus: record['Employment Status'] ?? '',
      department: record['Department'] ?? '',
      coverageEligibilityStatus: record['Coverage Eligibility Status'] ?? '',
      email: record['Email'] || undefined,
      phone: record['Phone'] || undefined,
      address: record['Address'] || undefined,
      dependentCount: record['Dependent Count'] ? Number(record['Dependent Count']) : undefined,
      planEligibilityGroup: record['Plan Eligibility Group'] || undefined
    });
  }

  return rows;
}

export function generateMockRowsForXlsx(): CensusImportRow[] {
  return Array.from({ length: 12 }).map((_, index) => {
    const sequence = index + 1;
    return {
      rowNumber: sequence + 1,
      employeeId: `XLSX-E-${5600 + sequence}`,
      firstName: `Employee${sequence}`,
      lastName: 'Imported',
      dateOfBirth: '1991-03-14',
      hireDate: '2026-03-01',
      employmentStatus: sequence % 4 === 0 ? 'Actve' : 'Active',
      department: sequence % 2 === 0 ? 'Engineering' : 'Finance',
      coverageEligibilityStatus: sequence % 5 === 0 ? 'Maybe' : 'Eligible',
      email: `employee${sequence}@example.com`,
      dependentCount: sequence % 3
    };
  });
}

export function validateCensusRows(
  rows: CensusImportRow[],
  existingEmployeeIds: string[]
): CensusValidationResult {
  const errors: CensusValidationError[] = [];
  const duplicateTracker = new Set<string>();
  const seenIds = new Set<string>();

  for (const row of rows) {
    const requiredChecks: Array<[keyof CensusImportRow, string]> = [
      ['employeeId', 'Employee ID'],
      ['firstName', 'First Name'],
      ['lastName', 'Last Name'],
      ['dateOfBirth', 'Date of Birth'],
      ['hireDate', 'Hire Date'],
      ['employmentStatus', 'Employment Status'],
      ['department', 'Department'],
      ['coverageEligibilityStatus', 'Coverage Eligibility Status']
    ];

    for (const [field, label] of requiredChecks) {
      if (isMissing(row[field])) {
        errors.push({
          rowNumber: row.rowNumber,
          employeeId: row.employeeId || 'Unknown',
          message: `Missing required field: ${label}`
        });
      }
    }

    if (row.dateOfBirth && !hasIsoDate(row.dateOfBirth)) {
      errors.push({
        rowNumber: row.rowNumber,
        employeeId: row.employeeId || 'Unknown',
        message: `Invalid date format for Date of Birth: ${row.dateOfBirth}`
      });
    }

    if (row.hireDate && !hasIsoDate(row.hireDate)) {
      errors.push({
        rowNumber: row.rowNumber,
        employeeId: row.employeeId || 'Unknown',
        message: `Invalid date format for Hire Date: ${row.hireDate}`
      });
    }

    const normalizedEmploymentStatus = String(row.employmentStatus).toLowerCase();
    if (row.employmentStatus && !employmentStatusValues.has(normalizedEmploymentStatus)) {
      errors.push({
        rowNumber: row.rowNumber,
        employeeId: row.employeeId || 'Unknown',
        message: `Invalid employment status value: ${row.employmentStatus}`
      });
    }

    const normalizedEligibility = String(row.coverageEligibilityStatus).toLowerCase();
    if (row.coverageEligibilityStatus && !coverageEligibilityValues.has(normalizedEligibility)) {
      errors.push({
        rowNumber: row.rowNumber,
        employeeId: row.employeeId || 'Unknown',
        message: `Invalid coverage eligibility value: ${row.coverageEligibilityStatus}`
      });
    }

    if (row.employeeId) {
      if (seenIds.has(row.employeeId)) {
        duplicateTracker.add(row.employeeId);
      }
      seenIds.add(row.employeeId);
    }
  }

  if (duplicateTracker.size > 0) {
    for (const duplicate of duplicateTracker) {
      const dupeRows = rows.filter((row) => row.employeeId === duplicate);
      for (const dupeRow of dupeRows) {
        errors.push({
          rowNumber: dupeRow.rowNumber,
          employeeId: dupeRow.employeeId,
          message: `Duplicate employee ID in file: ${dupeRow.employeeId}`
        });
      }
    }
  }

  const rowsWithErrors = new Set(errors.map((error) => error.rowNumber));
  const errorRows = rows.filter((row) => rowsWithErrors.has(row.rowNumber));
  const validRows = rows.filter((row) => !rowsWithErrors.has(row.rowNumber));

  const normalizedExisting = new Set(existingEmployeeIds.map((employeeId) => employeeId.toUpperCase()));
  const updatedEmployees: CensusImportRow[] = [];
  const newEmployees: CensusImportRow[] = [];
  const unchangedRecords: CensusImportRow[] = [];

  for (const row of validRows) {
    const normalizedEmployeeId = row.employeeId.toUpperCase();

    if (!normalizedExisting.has(normalizedEmployeeId)) {
      newEmployees.push(row);
      continue;
    }

    if (row.rowNumber % 3 === 0) {
      unchangedRecords.push(row);
    } else {
      updatedEmployees.push(row);
    }
  }

  return {
    rowsProcessed: rows.length,
    validRecords: validRows.length,
    errorCount: errors.length,
    errors,
    newEmployees,
    updatedEmployees,
    unchangedRecords,
    errorRows
  };
}

export function getCensusImportsForTenant(tenantId: string, alignment?: HrisImportAlignment): CensusImportBatch[] {
  const scoped = seedImports.map((batch) => {
    const scoped = cloneImportBatch(batch);
    return {
      ...scoped,
      id: `${tenantId}-${scoped.id}`
    };
  });

  if (!alignment || scoped.length === 0) {
    return scoped;
  }

  const latest = { ...scoped[0] };
  latest.importDate = alignment.lastImportDate ?? latest.importDate;
  latest.importStatus = (alignment.lastImportStatus as CensusImportStatus) ?? latest.importStatus;
  latest.recordsAdded = alignment.employeesAdded ?? latest.recordsAdded;
  latest.recordsUpdated = alignment.employeesUpdated ?? latest.recordsUpdated;
  latest.recordsRejected = alignment.importErrors ?? latest.recordsRejected;
  latest.totalRecords = Math.max(
    latest.totalRecords,
    latest.recordsAdded + latest.recordsUpdated + latest.recordsRejected
  );

  if (latest.recordsRejected <= 0) {
    latest.validationErrors = [];
  } else if (latest.validationErrors.length !== latest.recordsRejected) {
    latest.validationErrors = Array.from({ length: latest.recordsRejected }).map((_, index) => ({
      rowNumber: 100 + index,
      employeeId: `E-ERR-${index + 1}`,
      message: 'Validation mismatch detected for imported census row.'
    }));
  }

  return [latest, ...scoped.slice(1)];
}

export function getCensusImportByIdForTenant(tenantId: string, importId: string, alignment?: HrisImportAlignment) {
  return getCensusImportsForTenant(tenantId, alignment).find((batch) => batch.id === importId) ?? null;
}

export function getLatestImportSummaryForTenant(tenantId: string, alignment?: HrisImportAlignment) {
  const imports = getCensusImportsForTenant(tenantId, alignment);
  const latest = imports.sort((a, b) => b.importDate.localeCompare(a.importDate))[0];

  if (!latest) {
    return {
      lastImportDate: undefined,
      lastImportStatus: 'No imports yet',
      employeesAdded: 0,
      employeesUpdated: 0,
      importErrors: 0
    };
  }

  return {
    lastImportDate: alignment?.lastImportDate ?? latest.importDate,
    lastImportStatus: alignment?.lastImportStatus ?? latest.importStatus,
    employeesAdded: alignment?.employeesAdded ?? latest.recordsAdded,
    employeesUpdated: alignment?.employeesUpdated ?? latest.recordsUpdated,
    importErrors: alignment?.importErrors ?? latest.recordsRejected
  };
}

export function getHrisConnectorsForTenant(tenantId: string, alignment?: HrisImportAlignment): HrisConnector[] {
  const connectors = connectorSeeds.map((connector, index) => {
    const scoped = cloneConnector(connector);
    if (tenantId.length % 2 === 0 && index === 1) {
      scoped.status = 'Configured';
      scoped.lastSyncDate = '2026-03-13';
      scoped.syncFrequency = 'Daily';
      scoped.notes = 'Payroll roster feed available in sandbox mode.';
    }

    return scoped;
  });

  if (!alignment) {
    return connectors;
  }

  const normalizedStatus = (alignment.lastImportStatus ?? '').toLowerCase();
  const hasErrors = (alignment.importErrors ?? 0) > 0 || normalizedStatus.includes('warning');
  const notConfigured = normalizedStatus.includes('not configured');
  const syncDate = alignment.lastImportDate ?? undefined;

  return connectors.map((connector, index) => {
    if (notConfigured) {
      return {
        ...connector,
        status: 'Not Configured',
        lastSyncDate: undefined
      };
    }

    if (index === 0) {
      return {
        ...connector,
        status: 'Configured',
        lastSyncDate: syncDate,
        syncFrequency: 'Daily',
        notes: 'Aligned to latest tenant import status.'
      };
    }

    if (hasErrors && index === 3) {
      return {
        ...connector,
        status: 'Sync Error',
        lastSyncDate: syncDate ?? connector.lastSyncDate
      };
    }

    return connector;
  });
}

export function buildDefaultValidationRowsForTenant(
  tenantId: string,
  sourceEmployees?: Array<{
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
    email: string;
    dependents: Array<unknown>;
  }>
): CensusImportRow[] {
  const employees = (sourceEmployees ?? getEmployerCensusRecordsForTenant(tenantId)).slice(0, 8);
  return employees.map((employee, index) => ({
    rowNumber: index + 2,
    employeeId: employee.employeeId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    dateOfBirth: index === 2 ? '1990/01/16' : '1990-01-16',
    hireDate: '2025-01-01',
    employmentStatus: index === 4 ? 'Actve' : 'Active',
    department: employee.department,
    coverageEligibilityStatus: index === 6 ? 'Maybe' : 'Eligible',
    email: employee.email,
    dependentCount: employee.dependents.length,
    planEligibilityGroup: index % 2 === 0 ? 'Standard' : 'Executive'
  }));
}
