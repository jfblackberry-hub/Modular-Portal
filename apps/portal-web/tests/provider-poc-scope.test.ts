import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PROVIDER_POC_EXCLUDED_MODULE_IDS,
  assertProviderPocScopeGuardrails
} from '../lib/provider-poc-scope';

test('provider poc scope guardrails allow deterministic provider operations configuration', () => {
  assert.doesNotThrow(() =>
    assertProviderPocScopeGuardrails({
      purchasedModules: ['provider_operations'],
      providerExperience: {
        title: 'Provider Operations'
      }
    })
  );
});

test('provider poc scope guardrails reject ai copilot and agentic workflow modules or flags', () => {
  assert.throws(
    () =>
      assertProviderPocScopeGuardrails({
        purchasedModules: ['provider_operations', PROVIDER_POC_EXCLUDED_MODULE_IDS[0]],
        providerPoc: {
          aiCopilotEnabled: true
        }
      }),
    /scope violation/i
  );

  assert.throws(
    () =>
      assertProviderPocScopeGuardrails({
        providerDemoData: {
          providerOperations: {
            agenticWorkflowsEnabled: true
          }
        }
      }),
    /scope violation/i
  );
});
