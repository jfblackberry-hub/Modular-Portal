import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildProviderReportView,
  createDefaultProviderReportingFilters,
  getProviderReportingOptions
} from '../lib/provider-reporting';

test('provider reporting options expose canned reports and operational filters', () => {
  const options = getProviderReportingOptions();

  assert.equal(options.reports.length, 4);
  assert.ok(options.locations.includes('Flint Clinic'));
  assert.ok(options.patientTypes.includes('Early Learner'));
  assert.ok(options.payers.includes('Meridian Medicaid'));
});

test('provider reporting view changes with report selection and filters', () => {
  const baseFilters = createDefaultProviderReportingFilters();
  const operationsView = buildProviderReportView(baseFilters);
  const denialView = buildProviderReportView({
    ...baseFilters,
    reportId: 'denial-recovery',
    payer: 'Blue Cross Blue Shield'
  });

  assert.equal(operationsView.reportLabel, 'Operational performance');
  assert.equal(denialView.reportLabel, 'Denial recovery');
  assert.ok(operationsView.metrics.length >= 4);
  assert.ok(denialView.tableRows.every((row) => row.values.payer.includes('Blue Cross') || row.values.payer === 'Blue Cross Blue Shield'));
});
