import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const widgetRegistryPath = path.resolve(
  currentDirectory,
  '../components/provider/operations/provider-operations-widget-registry.tsx'
);
const liveDashboardHookPath = path.resolve(
  currentDirectory,
  '../lib/use-provider-operations-live-dashboard.ts'
);
const dashboardPagePath = path.resolve(
  currentDirectory,
  '../app/provider/dashboard/page.tsx'
);
const dataLayerPath = path.resolve(
  currentDirectory,
  '../lib/provider-operations-data.ts'
);

test('provider operations widgets do not connect directly to sources or tenant demo config', async () => {
  const widgetRegistrySource = await readFile(widgetRegistryPath, 'utf8');
  const liveDashboardHookSource = await readFile(liveDashboardHookPath, 'utf8');

  assert.doesNotMatch(widgetRegistrySource, /providerDemoData/);
  assert.doesNotMatch(widgetRegistrySource, /brandingConfig/);
  assert.doesNotMatch(widgetRegistrySource, /\bprisma\b/);
  assert.doesNotMatch(widgetRegistrySource, /\bconnector\b/i);
  assert.match(widgetRegistrySource, /ProviderOperationsDashboardContract/);
  assert.match(liveDashboardHookSource, /\bfetch\s*\(/);
  assert.match(liveDashboardHookSource, /EventSource/);
});

test('provider dashboard route resolves data through the centralized provider operations data layer', async () => {
  const dashboardPageSource = await readFile(dashboardPagePath, 'utf8');

  assert.match(dashboardPageSource, /getProviderOperationsDashboardSnapshot/);
});

test('provider operations data layer owns scoping and aggregation enforcement', async () => {
  const dataLayerSource = await readFile(dataLayerPath, 'utf8');

  assert.match(dataLayerSource, /resolveProviderOperationsDashboardData/);
  assert.match(dataLayerSource, /activeOrganizationUnit/);
  assert.match(dataLayerSource, /rollupAuthorized/);
  assert.match(dataLayerSource, /ProviderOperationsWidgetContract/);
});
