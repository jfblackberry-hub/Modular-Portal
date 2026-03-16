'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type {
  CensusImportBatch,
  CensusImportRow,
  CensusValidationResult,
  HrisConnector
} from '../../lib/hris-census-import-data';
import {
  generateMockRowsForXlsx,
  parseCsvRows,
  validateCensusRows
} from '../../lib/hris-census-import-data';
import { EmptyState, StatusBadge } from '../portal-ui';

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function renderPreviewRows(rows: CensusImportRow[]) {
  return rows.slice(0, 6);
}

export function EmployerCensusImportManager({
  tenantName,
  existingEmployeeIds,
  importHistory,
  connectors,
  seededRows
}: {
  tenantName: string;
  existingEmployeeIds: string[];
  importHistory: CensusImportBatch[];
  connectors: HrisConnector[];
  seededRows: CensusImportRow[];
}) {
  const [fileName, setFileName] = useState('');
  const [fileKind, setFileKind] = useState<'csv' | 'xlsx' | ''>('');
  const [validation, setValidation] = useState<CensusValidationResult | null>(null);
  const [validationRows, setValidationRows] = useState<CensusImportRow[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [importCommitted, setImportCommitted] = useState(false);

  const duplicateImportDetected = useMemo(() => {
    if (!fileName) {
      return false;
    }

    return importHistory.some(
      (item) => item.fileName.toLowerCase() === fileName.toLowerCase()
    );
  }, [fileName, importHistory]);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImportCommitted(false);
    setErrorMessage('');
    setInfoMessage('');
    setValidation(null);

    const lowerFileName = file.name.toLowerCase();
    setFileName(file.name);

    if (lowerFileName.endsWith('.csv')) {
      setFileKind('csv');
      const content = await file.text();
      const rows = parseCsvRows(content);
      setValidationRows(rows);
      runValidation(rows, file.name);
      return;
    }

    if (lowerFileName.endsWith('.xlsx')) {
      setFileKind('xlsx');
      const rows = generateMockRowsForXlsx();
      setValidationRows(rows);
      setInfoMessage('XLSX parsing is shown with mock preview data in this prototype.');
      runValidation(rows, file.name);
      return;
    }

    setFileKind('');
    setErrorMessage('Unsupported file type. Upload CSV or XLSX.');
  }

  function runValidation(rows: CensusImportRow[], sourceName: string) {
    if (rows.length === 0) {
      setValidation(null);
      setErrorMessage('Upload file is empty. Add at least one census row to continue.');
      return;
    }

    const nextValidation = validateCensusRows(rows, existingEmployeeIds);
    setValidation(nextValidation);

    if (rows.length > 1000) {
      setInfoMessage('Large file detected (1000+ rows). Preview is truncated for performance.');
    } else if (sourceName) {
      setInfoMessage(`Validation complete for ${sourceName}.`);
    }
  }

  function loadSeededValidationExample() {
    setFileName('seeded-census-preview.csv');
    setFileKind('csv');
    setValidationRows(seededRows);
    runValidation(seededRows, 'seeded-census-preview.csv');
  }

  function confirmImport() {
    if (!validation) {
      return;
    }

    if (validation.rowsProcessed === validation.errorCount) {
      setErrorMessage('All rows failed validation. Resolve errors before committing import.');
      return;
    }

    setImportCommitted(true);
    setErrorMessage('');
    setInfoMessage(
      `Import committed for ${fileName}. Added ${validation.newEmployees.length}, updated ${validation.updatedEmployees.length}, rejected ${validation.errorRows.length}.`
    );
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">HRIS &amp; Census Import</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Census Import
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
          Upload employee census files for {tenantName}, validate records, preview updates, and confirm import.
        </p>
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Upload Census File</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/billing-enrollment/census-import/history" className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              View Import History
            </Link>
            <Link href="/dashboard/billing-enrollment/census-import/errors" className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              Resolve Import Errors
            </Link>
            <Link href="/dashboard/billing-enrollment/census-import/integrations" className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              Configure HRIS Integration
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">File Upload</span>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
              className="mt-1 block h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm"
            />
          </label>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-semibold text-[var(--text-primary)]">Supported types</p>
            <p className="mt-1">CSV, Excel (XLSX)</p>
            <p className="mt-2 text-xs">Required fields: Employee ID, First Name, Last Name, Date of Birth, Hire Date, Employment Status, Department, Coverage Eligibility Status.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadSeededValidationExample}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            Load Seeded Preview
          </button>
          {validation ? (
            <button
              type="button"
              onClick={confirmImport}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white"
            >
              Confirm Import
            </button>
          ) : null}
        </div>

        {duplicateImportDetected ? (
          <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Duplicate import detected: file name already exists in import history.
          </p>
        ) : null}
        {infoMessage ? (
          <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{infoMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">{errorMessage}</p>
        ) : null}
        {importCommitted ? (
          <p className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Import has been committed successfully.
          </p>
        ) : null}
      </section>

      {validation ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="portal-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Rows Processed</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{validation.rowsProcessed}</p>
            </article>
            <article className="portal-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Valid Records</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{validation.validRecords}</p>
            </article>
            <article className="portal-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Errors</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{validation.errorCount}</p>
            </article>
          </section>

          <section className="portal-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Import Preview</h2>
              <StatusBadge label={fileKind === 'xlsx' ? 'XLSX Preview' : 'CSV Preview'} />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Employees ({validation.newEmployees.length})</h3>
                <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                  {renderPreviewRows(validation.newEmployees).map((row) => (
                    <li key={`new-${row.rowNumber}`}>{row.employeeId} • {row.firstName} {row.lastName}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Updated Employees ({validation.updatedEmployees.length})</h3>
                <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                  {renderPreviewRows(validation.updatedEmployees).map((row) => (
                    <li key={`upd-${row.rowNumber}`}>{row.employeeId} • {row.firstName} {row.lastName}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Unchanged Records ({validation.unchangedRecords.length})</h3>
                <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                  {renderPreviewRows(validation.unchangedRecords).map((row) => (
                    <li key={`same-${row.rowNumber}`}>{row.employeeId} • {row.firstName} {row.lastName}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Error Rows ({validation.errorRows.length})</h3>
                <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                  {renderPreviewRows(validation.errorRows).map((row) => (
                    <li key={`err-${row.rowNumber}`}>Row {row.rowNumber} • {row.employeeId || 'Unknown ID'}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className="portal-card p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Validation Errors</h2>
            {validation.errors.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No validation errors" description="All records passed validation checks." />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="portal-data-table w-full border-collapse bg-white text-sm">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Employee ID</th>
                      <th>Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validation.errors.map((error, index) => (
                      <tr key={`${error.rowNumber}-${error.employeeId}-${index}`}>
                        <td>{error.rowNumber}</td>
                        <td>{error.employeeId}</td>
                        <td>{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="portal-card p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Preview Table</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Showing {Math.min(validationRows.length, 20)} of {validationRows.length} rows.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="portal-data-table w-full border-collapse bg-white text-sm">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Date of Birth</th>
                    <th>Hire Date</th>
                    <th>Employment Status</th>
                    <th>Department</th>
                    <th>Coverage Eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  {validationRows.slice(0, 20).map((row) => (
                    <tr key={`preview-${row.rowNumber}`}>
                      <td>{row.employeeId}</td>
                      <td>{row.firstName}</td>
                      <td>{row.lastName}</td>
                      <td>{row.dateOfBirth}</td>
                      <td>{row.hireDate}</td>
                      <td>{row.employmentStatus}</td>
                      <td>{row.department}</td>
                      <td>{row.coverageEligibilityStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="portal-card p-5">
          <EmptyState
            title="Upload a census file to begin"
            description="Validation summary and import preview will appear after file processing."
          />
        </section>
      )}

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">HRIS Connector Snapshot</h2>
          <Link href="/dashboard/billing-enrollment/census-import/integrations" className="rounded-full border border-[var(--tenant-primary-color)] px-3 py-1.5 text-xs font-semibold text-[var(--tenant-primary-color)]">
            Configure Connectors
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {connectors.map((connector) => (
            <article key={connector.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="font-semibold text-[var(--text-primary)]">{connector.provider}</p>
              <div className="mt-2"><StatusBadge label={connector.status} /></div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">Last sync: {formatDate(connector.lastSyncDate)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
