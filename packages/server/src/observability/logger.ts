import { randomUUID } from 'node:crypto';

import { loadObservabilityConfig } from '@payer-portal/config';

export type StructuredLogLevel = 'debug' | 'error' | 'info' | 'warn';

type StructuredLoggerContext = Record<string, unknown>;

export function resolveCorrelationId(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return randomUUID();
}

function writeLog(level: StructuredLogLevel, payload: Record<string, unknown>) {
  const serialized = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...payload
  });

  switch (level) {
    case 'debug':
    case 'info':
      console.log(serialized);
      return;
    case 'warn':
      console.warn(serialized);
      return;
    case 'error':
      console.error(serialized);
      return;
  }
}

export function createStructuredLogger(input: {
  correlationId?: string;
  context?: StructuredLoggerContext;
  serviceName?: string;
}) {
  const observability = loadObservabilityConfig(
    process.env,
    input.serviceName ?? process.env.APP_NAME ?? 'payer-portal-service'
  );
  const basePayload = {
    service: observability.serviceName,
    correlationId: resolveCorrelationId(input.correlationId),
    ...(input.context ?? {})
  };

  return {
    child(context: StructuredLoggerContext) {
      return createStructuredLogger({
        correlationId: basePayload.correlationId,
        context: {
          ...basePayload,
          ...context
        },
        serviceName: observability.serviceName
      });
    },
    correlationId: basePayload.correlationId,
    debug(message: string, context?: StructuredLoggerContext) {
      writeLog('debug', {
        ...basePayload,
        message,
        ...(context ?? {})
      });
    },
    error(message: string, context?: StructuredLoggerContext) {
      writeLog('error', {
        ...basePayload,
        message,
        ...(context ?? {})
      });
    },
    info(message: string, context?: StructuredLoggerContext) {
      writeLog('info', {
        ...basePayload,
        message,
        ...(context ?? {})
      });
    },
    warn(message: string, context?: StructuredLoggerContext) {
      writeLog('warn', {
        ...basePayload,
        message,
        ...(context ?? {})
      });
    }
  };
}
