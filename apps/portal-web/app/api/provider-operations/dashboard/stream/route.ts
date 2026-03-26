import type { ProviderOperationsDashboardContract } from '@payer-portal/api-contracts';

import { getProviderOperationsDashboardSnapshot } from '../../../../../lib/provider-operations-snapshot';

export const runtime = 'nodejs';

function encodeSseEvent(input: {
  event: 'dashboard' | 'heartbeat';
  data: Record<string, unknown> | ProviderOperationsDashboardContract;
}) {
  return `event: ${input.event}\ndata: ${JSON.stringify(input.data)}\n\n`;
}

async function readDashboard() {
  const { dashboard } = await getProviderOperationsDashboardSnapshot();
  return dashboard;
}

export async function GET() {
  let dashboard: ProviderOperationsDashboardContract;

  try {
    dashboard = await readDashboard();
  } catch (error) {
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to establish provider operations stream.'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  let refreshInterval: ReturnType<typeof setInterval> | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(encodeSseEvent({ event: 'dashboard', data: dashboard }))
      );

      refreshInterval = setInterval(async () => {
        try {
          const nextDashboard = await readDashboard();
          controller.enqueue(
            encoder.encode(
              encodeSseEvent({ event: 'dashboard', data: nextDashboard })
            )
          );
        } catch {
          controller.enqueue(
            encoder.encode(
              encodeSseEvent({
                event: 'heartbeat',
                data: { degraded: true, timestamp: new Date().toISOString() }
              })
            )
          );
        }
      }, 30_000);

      heartbeatInterval = setInterval(() => {
        controller.enqueue(
          encoder.encode(
            encodeSseEvent({
              event: 'heartbeat',
              data: { degraded: false, timestamp: new Date().toISOString() }
            })
          )
        );
      }, 15_000);
    },
    cancel() {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream'
    }
  });
}
