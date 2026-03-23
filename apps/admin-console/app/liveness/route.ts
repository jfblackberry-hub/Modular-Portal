import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    checks: {
      process: {
        uptimeSeconds: Math.round(process.uptime())
      }
    },
    service: 'admin-console',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
