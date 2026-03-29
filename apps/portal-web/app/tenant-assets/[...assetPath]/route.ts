import { config } from '../../../lib/server-runtime';

type RouteContext = {
  params: Promise<{
    assetPath?: string[];
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const assetPath = Array.isArray(params.assetPath) ? params.assetPath : [];

  if (assetPath.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  const upstreamUrl = `${config.apiBaseUrl}/tenant-assets/${assetPath
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    cache: 'no-store'
  });

  if (!upstreamResponse.ok) {
    return new Response(await upstreamResponse.text(), {
      status: upstreamResponse.status,
      headers: {
        'content-type':
          upstreamResponse.headers.get('content-type') ?? 'text/plain; charset=utf-8'
      }
    });
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      'cache-control':
        upstreamResponse.headers.get('cache-control') ?? 'public, max-age=300',
      'content-type':
        upstreamResponse.headers.get('content-type') ?? 'application/octet-stream'
    }
  });
}
