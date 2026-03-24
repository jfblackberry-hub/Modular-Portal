import type { IncomingMessage, ServerResponse } from 'node:http';

import { metrics } from '@opentelemetry/api';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { loadObservabilityConfig } from '@payer-portal/config';

import { subscribe } from '../events/eventBus.js';

const observabilityConfig = loadObservabilityConfig();
const prometheusPort = observabilityConfig.prometheusPort;
const prometheusPath = observabilityConfig.prometheusPath;

let initialized = false;
let subscriptionsRegistered = false;

const exporter = new PrometheusExporter(
  {
    endpoint: prometheusPath,
    host: observabilityConfig.prometheusHost,
    port: prometheusPort
  },
  () => undefined
);

const meterProvider = new MeterProvider({
  readers: [exporter]
});

metrics.setGlobalMeterProvider(meterProvider);

const meter = metrics.getMeter(observabilityConfig.serviceName, '0.1.0');

const apiRequestCounter = meter.createCounter('platform_api_requests_total', {
  description: 'Total API requests processed by the platform API.'
});
const apiErrorCounter = meter.createCounter('platform_api_errors_total', {
  description: 'Total API requests resulting in error responses.'
});
const apiLatencyHistogram = meter.createHistogram('platform_api_latency_ms', {
  description: 'API request latency in milliseconds.',
  unit: 'ms'
});
const workflowDurationHistogram = meter.createHistogram(
  'platform_workflow_execution_duration_ms',
  {
    description: 'Workflow execution duration measured from started to completed events.',
    unit: 'ms'
  }
);
const notificationThroughputCounter = meter.createCounter(
  'platform_notification_sent_total',
  {
    description: 'Notifications successfully sent by channel.'
  }
);
const integrationActivityCounter = meter.createCounter(
  'platform_integration_activity_total',
  {
    description: 'Integration execution attempts by adapter, trigger mode, and status.'
  }
);
const integrationDurationHistogram = meter.createHistogram(
  'platform_integration_execution_duration_ms',
  {
    description: 'Integration execution duration in milliseconds.',
    unit: 'ms'
  }
);

const workflowStartTimes = new Map<string, number>();

function getWorkflowKey(input: {
  correlationId: string;
  workflowId?: string;
}) {
  return `${input.correlationId}:${input.workflowId ?? 'unknown'}`;
}

function registerEventMetrics() {
  if (subscriptionsRegistered) {
    return;
  }

  subscriptionsRegistered = true;

  subscribe(
    'workflow.started',
    async (event) => {
      workflowStartTimes.set(
        getWorkflowKey({
          correlationId: event.correlationId,
          workflowId: event.payload.workflowId
        }),
        event.timestamp.getTime()
      );
    },
    {
      subscriberId: 'monitoring.workflow.started'
    }
  );

  subscribe(
    'workflow.completed',
    async (event) => {
      const key = getWorkflowKey({
        correlationId: event.correlationId,
        workflowId: event.payload.workflowId
      });
      const startedAt = workflowStartTimes.get(key);

      if (!startedAt) {
        return;
      }

      workflowStartTimes.delete(key);
      workflowDurationHistogram.record(event.timestamp.getTime() - startedAt, {
        status: event.payload.status,
        workflow_type: event.payload.workflowType
      });
    },
    {
      subscriberId: 'monitoring.workflow.completed'
    }
  );

  subscribe(
    'notification.sent',
    async (event) => {
      notificationThroughputCounter.add(1, {
        channel: event.payload.channel
      });
    },
    {
      subscriberId: 'monitoring.notification.sent'
    }
  );
}

export function initializeMonitoring() {
  if (initialized) {
    return;
  }

  initialized = true;
  registerEventMetrics();
}

export function recordApiRequest(input: {
  durationMs: number;
  method: string;
  route: string;
  statusCode: number;
}) {
  const attributes = {
    method: input.method,
    route: input.route,
    status_code: String(input.statusCode)
  };

  apiRequestCounter.add(1, attributes);
  apiLatencyHistogram.record(input.durationMs, attributes);

  if (input.statusCode >= 400) {
    apiErrorCounter.add(1, attributes);
  }
}

export function recordIntegrationExecution(input: {
  adapterKey: string;
  durationMs: number;
  status: 'FAILED' | 'SUCCEEDED';
  triggerMode: string;
}) {
  const attributes = {
    adapter_key: input.adapterKey,
    status: input.status,
    trigger_mode: input.triggerMode
  };

  integrationActivityCounter.add(1, attributes);
  integrationDurationHistogram.record(input.durationMs, attributes);
}

export function handlePrometheusMetrics(
  request: IncomingMessage,
  response: ServerResponse
) {
  initializeMonitoring();
  exporter.getMetricsRequestHandler(request, response);
}
