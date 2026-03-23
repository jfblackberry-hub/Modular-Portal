import {
  ensureLocalStack,
  expectHttpStatus,
  stopLocalStackIfStarted
} from './local-stack-harness.mjs';
import {
  formatAuthenticatedCoverageSummary,
  validateReleaseWorkflows
} from './release-workflows.mjs';

async function main() {
  const { startedByHarness, origins } = await ensureLocalStack();

  try {
    const coverage = await validateReleaseWorkflows(origins);
    await expectHttpStatus(`${origins.admin}/admin/platform/health`, [200]);

    console.log(`Integration suite passed. ${formatAuthenticatedCoverageSummary(coverage)}`);
  } finally {
    stopLocalStackIfStarted(startedByHarness);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
