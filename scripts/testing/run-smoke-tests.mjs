import {
  ensureLocalStack,
  expectHttpStatus,
  printCheck,
  stopLocalStackIfStarted
} from './local-stack-harness.mjs';

const checks = [
  {
    name: 'portal liveness responds',
    url: '/liveness',
    service: 'portal',
    statuses: [200]
  },
  {
    name: 'portal readiness responds',
    url: '/readiness',
    service: 'portal',
    statuses: [200, 503]
  },
  {
    name: 'admin liveness responds',
    url: '/liveness',
    service: 'admin',
    statuses: [200]
  },
  {
    name: 'admin readiness responds',
    url: '/readiness',
    service: 'admin',
    statuses: [200, 503]
  },
  {
    name: 'api liveness responds',
    url: '/liveness',
    service: 'api',
    statuses: [200]
  },
  {
    name: 'api readiness responds',
    url: '/readiness',
    service: 'api',
    statuses: [200, 503]
  },
  {
    name: 'api health responds',
    url: '/health',
    service: 'api',
    statuses: [200, 503]
  }
];

function originFor(service, origins) {
  switch (service) {
    case 'portal':
      return origins.portal;
    case 'admin':
      return origins.admin;
    case 'api':
      return origins.api;
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

async function main() {
  const { startedByHarness, origins } = await ensureLocalStack();

  try {
    for (const check of checks) {
      const response = await expectHttpStatus(
        `${originFor(check.service, origins)}${check.url}`,
        check.statuses
      );
      printCheck(check.name, `${response.status} ${check.url}`);
    }

    console.log('Smoke suite passed.');
  } finally {
    stopLocalStackIfStarted(startedByHarness);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
