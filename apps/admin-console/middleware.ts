import './lib/runtime-config';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  if (pathname === '/api/auth/me') {
    const authorization = request.headers.get('authorization');
    const tenantId = request.headers.get('x-tenant-id');

    if (!authorization && !tenantId) {
      return NextResponse.json(
        {
          message:
            'Tenant context required. Provide x-tenant-id or an authenticated bearer token.'
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
