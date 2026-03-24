import { NextResponse } from 'next/server';

import {
  ADMIN_SESSION_COOKIE,
  readAdminSessionEnvelopeFromCookie
} from '../../../../lib/admin-session-cookie';
import { config } from '../../../../lib/server-runtime';

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

async function handleProxy(request: Request, context: RouteContext) {
  const cookieValue =
    request.headers
      .get('cookie')
      ?.split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${ADMIN_SESSION_COOKIE}=`))
      ?.slice(`${ADMIN_SESSION_COOKIE}=`.length) ?? null;
  const sessionEnvelope = readAdminSessionEnvelopeFromCookie(cookieValue);

  if (!sessionEnvelope) {
    return NextResponse.json(
      { message: 'Authenticated admin session required.' },
      { status: 401 }
    );
  }

  const { path = [] } = await context.params;
  const targetUrl = new URL(
    `/${path.map((segment) => encodeURIComponent(segment)).join('/')}`,
    config.serviceEndpoints.api
  );
  const requestUrl = new URL(request.url);

  targetUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('authorization');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('cookie');
  headers.delete('host');
  headers.set('Authorization', `Bearer ${sessionEnvelope.accessToken}`);

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.arrayBuffer(),
    cache: 'no-store',
    redirect: 'manual'
  });
  const responseHeaders = new Headers(response.headers);

  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  responseHeaders.delete('transfer-encoding');

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders
  });
}

export async function GET(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}
