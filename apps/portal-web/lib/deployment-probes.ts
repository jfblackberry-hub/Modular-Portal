import { config } from './server-runtime';

type HealthCheckStatus = 'ok' | 'degraded' | 'down';

type HealthResponse = {
  checks: Record<string, HealthCheckStatus>;
  status: HealthCheckStatus;
};

function buildRuntimeHealthResponse(
  checks: Record<string, HealthCheckStatus>
): HealthResponse {
  const values = Object.values(checks);

  return {
    checks,
    status: values.some((value) => value === 'down')
      ? 'down'
      : values.some((value) => value === 'degraded')
        ? 'degraded'
        : 'ok'
  };
}

function buildRuntimeLivenessResponse(): HealthResponse {
  return buildRuntimeHealthResponse({
    process: 'ok'
  });
}

async function probeHttpDependency(url: string, timeoutMs = 150) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal
    });

    return response.ok ? 'ok' : 'down';
  } catch {
    return 'down';
  } finally {
    clearTimeout(timeout);
  }
}

function getPortalConfigStatus() {
  return config.serviceEndpoints.portal.trim() && config.serviceEndpoints.api.trim()
    ? 'ok'
    : 'down';
}

export function getPortalLiveness() {
  return buildRuntimeLivenessResponse();
}

export async function getPortalReadiness() {
  const response = buildRuntimeHealthResponse({
    config: getPortalConfigStatus(),
    api: await probeHttpDependency(`${config.serviceEndpoints.api}/api/health/ready`)
  });

  return {
    ready: response.status === 'ok',
    response
  } as const;
}
