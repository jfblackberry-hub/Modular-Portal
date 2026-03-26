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
const workflowActionButtonPath = path.resolve(
  currentDirectory,
  '../components/provider/operations/provider-workflow-action-button.tsx'
);
const providerPocScopePath = path.resolve(
  currentDirectory,
  '../lib/provider-poc-scope.ts'
);

test('provider operation widgets remain decoupled from workflow execution transport', async () => {
  const widgetRegistrySource = await readFile(widgetRegistryPath, 'utf8');
  const workflowActionButtonSource = await readFile(workflowActionButtonPath, 'utf8');

  assert.doesNotMatch(widgetRegistrySource, /provider-operations\/workflows/);
  assert.doesNotMatch(widgetRegistrySource, /\bfetch\s*\(/);
  assert.match(workflowActionButtonSource, /\/api\/provider-operations\/workflows/);
  assert.match(workflowActionButtonSource, /\bfetch\s*\(/);
});

test('provider poc files carry explicit exclusions instead of ai copilot or agentic dependencies', async () => {
  const widgetRegistrySource = await readFile(widgetRegistryPath, 'utf8');
  const providerPocScopeSource = await readFile(providerPocScopePath, 'utf8');

  assert.doesNotMatch(widgetRegistrySource, /copilot/i);
  assert.doesNotMatch(widgetRegistrySource, /agentic/i);
  assert.match(providerPocScopeSource, /provider_ai_copilot/);
  assert.match(providerPocScopeSource, /provider_agentic_workflows/);
});
