export type RuntimeHealthCheckStatus = 'ok' | 'degraded' | 'down';

export type RuntimeHealthResponse = {
  checks: Record<string, RuntimeHealthCheckStatus>;
  status: RuntimeHealthCheckStatus;
};

function summarizeChecks(
  checks: Record<string, RuntimeHealthCheckStatus>
): RuntimeHealthCheckStatus {
  const values = Object.values(checks);

  if (values.some((value) => value === 'down')) {
    return 'down';
  }

  if (values.some((value) => value === 'degraded')) {
    return 'degraded';
  }

  return 'ok';
}

export function buildRuntimeHealthResponse(
  checks: Record<string, RuntimeHealthCheckStatus>
): RuntimeHealthResponse {
  return {
    checks,
    status: summarizeChecks(checks)
  };
}

export function buildRuntimeLivenessResponse(): RuntimeHealthResponse {
  return buildRuntimeHealthResponse({
    process: 'ok'
  });
}

export async function probeHttpDependency(
  url: string,
  input?: {
    timeoutMs?: number;
  }
): Promise<RuntimeHealthCheckStatus> {
  const controller = new AbortController();
  const timeoutMs = input?.timeoutMs ?? 150;
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
