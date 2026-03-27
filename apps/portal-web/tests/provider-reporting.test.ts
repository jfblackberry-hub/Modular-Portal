import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PROVIDER_REPORT_LIBRARY,
  createDefaultProviderReportingFilters
} from '../lib/provider-reporting';
import {
  getProviderReportingStaticOptionsFromWarehouse,
  getProviderReportingWarehouseSummary,
  runProviderReport
} from '../lib/provider-reporting-service';

test('provider reporting exposes a 10-report canned report library', () => {
  assert.equal(PROVIDER_REPORT_LIBRARY.length, 10);
  assert.equal(PROVIDER_REPORT_LIBRARY[0]?.label, 'Patient Census Report');
  assert.equal(
    PROVIDER_REPORT_LIBRARY[PROVIDER_REPORT_LIBRARY.length - 1]?.label,
    'Executive Business Summary'
  );
});

test('provider reporting warehouse summary reflects a 2-year ABA clinic dataset', () => {
  const summary = getProviderReportingWarehouseSummary();

  assert.equal(summary.lookbackMonths, 24);
  assert.equal(summary.approximateRecordCounts.patients, 300);
  assert.equal(summary.approximateRecordCounts.locations, 5);
  assert.ok(summary.approximateRecordCounts.sessions > 10000);
  assert.ok(summary.approximateRecordCounts.claims > 1000);
  assert.ok(summary.approximateRecordCounts.authorizations >= 300);
});

test('provider reporting options expose warehouse-backed filter dimensions', () => {
  const options = getProviderReportingStaticOptionsFromWarehouse();

  assert.equal(options.library.length, 10);
  assert.ok(options.locations.some((option) => option.label === 'Apara Flint Center'));
  assert.ok(options.patientTypes.some((option) => option.label === 'Early Learner'));
  assert.ok(options.payers.some((option) => option.label === 'Meridian Medicaid'));
  assert.ok(options.therapists.length > 10);
  assert.ok(options.supervisingClinicians.length >= 5);
});

test('executive summary report returns business KPIs, charts, and a location table', () => {
  const report = runProviderReport(createDefaultProviderReportingFilters());

  assert.equal(report.reportId, 'executive-business-summary');
  assert.equal(report.metrics.length, 4);
  assert.equal(report.charts.length, 2);
  assert.equal(report.table.columns[0]?.label, 'Location');
  assert.ok(report.table.rows.length >= 5);
  assert.ok(report.notes.length >= 3);
});

test('claims and revenue report respects payer and status filters', () => {
  const options = getProviderReportingStaticOptionsFromWarehouse();
  const payer = options.payers.find((option) => option.value !== 'all')?.value;

  assert.ok(payer);

  const report = runProviderReport({
    ...createDefaultProviderReportingFilters(),
    reportId: 'claims-revenue',
    payer: payer!,
    claimStatus: 'denied',
    dateRange: 'last_24_months'
  });

  assert.equal(report.reportId, 'claims-revenue');
  assert.ok(report.table.rows.length > 0);
  assert.ok(report.appliedFiltersLabel.includes(payer!));
  assert.ok(
    report.table.rows.every((row) =>
      (row.values.payer ?? '').includes(payer!)
    )
  );
});

test('therapist utilization report can isolate a single therapist', () => {
  const options = getProviderReportingStaticOptionsFromWarehouse();
  const therapist = options.therapists.find((option) => option.value !== 'all')?.value;

  assert.ok(therapist);

  const report = runProviderReport({
    ...createDefaultProviderReportingFilters(),
    reportId: 'therapist-utilization',
    therapist: therapist!
  });

  assert.equal(report.reportId, 'therapist-utilization');
  assert.ok(report.table.rows.length >= 1);
  assert.ok(report.table.rows.every((row) => row.values.therapist === therapist));
});
