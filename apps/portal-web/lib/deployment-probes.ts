import { apiInternalOrigin } from './server-runtime';

export async function getPortalReadiness() {
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(`${apiInternalOrigin}/readiness`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');

      return {
        ready: false,
        response: {
          checks: {
            api: {
              details: body.slice(0, 300),
              status: 'fail'
            }
          },
          service: 'portal-web',
          status: 'degraded',
          timestamp
        }
      } as const;
    }

    return {
      ready: true,
      response: {
        checks: {
          api: {
            status: 'pass'
          }
        },
        service: 'portal-web',
        status: 'ok',
        timestamp
      }
    } as const;
  } catch (error) {
    return {
      ready: false,
      response: {
        checks: {
          api: {
            error: error instanceof Error ? error.message : 'API readiness failed',
            status: 'fail'
          }
        },
        service: 'portal-web',
        status: 'degraded',
        timestamp
      }
    } as const;
  }
}
