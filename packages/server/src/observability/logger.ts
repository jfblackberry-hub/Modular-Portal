import { loadObservabilityConfig } from '@payer-portal/config';

export type StructuredLogLevel = 'debug' | 'error' | 'info' | 'warn';

type StructuredLoggerContext = Record<string, unknown>;

import {
  mergeObservabilityContext,
  resolveObservabilityCorrelationId,
  type ObservabilityContextInput
} from './schema.js';

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
  observability: Omit<ObservabilityContextInput, 'correlationId'>;
  serviceName?: string;
}) {
  const observability = loadObservabilityConfig(undefined, input.serviceName);
  const observabilityContext = mergeObservabilityContext(
    {
      ...input.observability,
      correlationId: input.correlationId
    },
    undefined
  );
  const basePayload = {
    service: observability.serviceName,
    ...observabilityContext,
    ...(input.context ?? {})
  };

  return {
    child(context: StructuredLoggerContext) {
      const nextObservabilityContext = mergeObservabilityContext(
        observabilityContext,
        context
      );
      return createStructuredLogger({
        correlationId: nextObservabilityContext.correlationId,
        context: {
          ...basePayload,
          ...nextObservabilityContext,
          ...context
        },
        observability: nextObservabilityContext,
        serviceName: observability.serviceName
      });
    },
    correlationId: basePayload.correlationId,
    debug(message: string, context?: StructuredLoggerContext) {
      const nextObservabilityContext = mergeObservabilityContext(
        observabilityContext,
        context
      );
      writeLog('debug', {
        ...basePayload,
        ...nextObservabilityContext,
        message,
        ...(context ?? {})
      });
    },
    error(message: string, context?: StructuredLoggerContext) {
      const nextObservabilityContext = mergeObservabilityContext(
        observabilityContext,
        context
      );
      writeLog('error', {
        ...basePayload,
        ...nextObservabilityContext,
        message,
        ...(context ?? {})
      });
    },
    info(message: string, context?: StructuredLoggerContext) {
      const nextObservabilityContext = mergeObservabilityContext(
        observabilityContext,
        context
      );
      writeLog('info', {
        ...basePayload,
        ...nextObservabilityContext,
        message,
        ...(context ?? {})
      });
    },
    warn(message: string, context?: StructuredLoggerContext) {
      const nextObservabilityContext = mergeObservabilityContext(
        observabilityContext,
        context
      );
      writeLog('warn', {
        ...basePayload,
        ...nextObservabilityContext,
        message,
        ...(context ?? {})
      });
    }
  };
}

export function resolveCorrelationId(value: unknown) {
  return resolveObservabilityCorrelationId(
    typeof value === 'string' ? value : undefined
  );
}
