'use client';

import { useMemo, useState } from 'react';

import type { CensusImportBatch, CensusImportRow } from '../../lib/hris-census-import-data';
import { EmptyState } from '../portal-ui';

type EditableErrorRow = CensusImportRow & {
  selected: boolean;
};

export function EmployerImportErrorResolution({ imports }: { imports: CensusImportBatch[] }) {
  const erroredBatches = useMemo(
    () => imports.filter((item) => item.recordsRejected > 0),
    [imports]
  );

  const [selectedImportId, setSelectedImportId] = useState(erroredBatches[0]?.id ?? '');
  const [rows, setRows] = useState<EditableErrorRow[]>(
    (erroredBatches[0]?.validationErrors ?? []).map((error) => ({
      rowNumber: error.rowNumber,
      employeeId: error.employeeId,
      firstName: 'Unknown',
      lastName: 'Record',
      dateOfBirth: '',
      hireDate: '',
      employmentStatus: '',
      department: '',
      coverageEligibilityStatus: '',
      selected: false
    }))
  );
  const [message, setMessage] = useState('');

  const selectedImport = useMemo(
    () => erroredBatches.find((batch) => batch.id === selectedImportId) ?? null,
    [erroredBatches, selectedImportId]
  );

  function loadRows(importId: string) {
    setSelectedImportId(importId);
    const batch = erroredBatches.find((item) => item.id === importId);
    setRows(
      (batch?.validationErrors ?? []).map((error) => ({
        rowNumber: error.rowNumber,
        employeeId: error.employeeId,
        firstName: 'Unknown',
        lastName: 'Record',
        dateOfBirth: '',
        hireDate: '',
        employmentStatus: '',
        department: '',
        coverageEligibilityStatus: '',
        selected: false
      }))
    );
    setMessage('');
  }

  function updateRow(index: number, field: keyof EditableErrorRow, value: string | boolean) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  }

  function removeInvalidRows() {
    const nextRows = rows.filter((row) => !row.selected);
    setRows(nextRows);
    setMessage('Selected invalid rows removed from reprocess set.');
  }

  function reprocessCorrectedRecords() {
    if (rows.length === 0) {
      setMessage('No rows available for reprocessing.');
      return;
    }

    setMessage(`Reprocess started for ${rows.length} corrected rows.`);
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">HRIS &amp; Census Import</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Import Error Resolution
        </h1>
      </section>

      <section className="portal-card p-5">
        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Import Batch</span>
          <select
            value={selectedImportId}
            onChange={(event) => loadRows(event.target.value)}
            className="mt-1 h-11 w-full max-w-xl rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
          >
            {erroredBatches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.fileName}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={removeInvalidRows} className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700">
            Remove Invalid Rows
          </button>
          <button type="button" onClick={reprocessCorrectedRecords} className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">
            Reprocess Corrected Records
          </button>
        </div>

        {selectedImport ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Resolving errors for {selectedImport.fileName} ({selectedImport.recordsRejected} rejected records).
          </p>
        ) : null}
        {message ? <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{message}</p> : null}
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Error Rows</h2>
        {rows.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No error rows" description="There are no invalid rows to resolve for this import." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Row</th>
                  <th>Employee ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Employment Status</th>
                  <th>Coverage Eligibility</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`err-row-${row.rowNumber}-${index}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(event) => updateRow(index, 'selected', event.target.checked)}
                      />
                    </td>
                    <td>{row.rowNumber}</td>
                    <td>
                      <input
                        value={row.employeeId}
                        onChange={(event) => updateRow(index, 'employeeId', event.target.value)}
                        className="h-9 w-32 rounded-lg border border-[var(--border-subtle)] px-2"
                      />
                    </td>
                    <td>
                      <input
                        value={row.firstName}
                        onChange={(event) => updateRow(index, 'firstName', event.target.value)}
                        className="h-9 w-28 rounded-lg border border-[var(--border-subtle)] px-2"
                      />
                    </td>
                    <td>
                      <input
                        value={row.lastName}
                        onChange={(event) => updateRow(index, 'lastName', event.target.value)}
                        className="h-9 w-28 rounded-lg border border-[var(--border-subtle)] px-2"
                      />
                    </td>
                    <td>
                      <input
                        value={row.employmentStatus}
                        onChange={(event) => updateRow(index, 'employmentStatus', event.target.value)}
                        className="h-9 w-36 rounded-lg border border-[var(--border-subtle)] px-2"
                        placeholder="Active"
                      />
                    </td>
                    <td>
                      <input
                        value={row.coverageEligibilityStatus}
                        onChange={(event) => updateRow(index, 'coverageEligibilityStatus', event.target.value)}
                        className="h-9 w-36 rounded-lg border border-[var(--border-subtle)] px-2"
                        placeholder="Eligible"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
