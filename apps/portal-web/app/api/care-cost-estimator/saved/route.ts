import { NextResponse } from 'next/server';

import { getEstimatorBootstrap, saveEstimateForMember, type EstimateResult } from '../../../../lib/care-cost-estimator/service';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export async function GET() {
  const user = await getPortalSessionUser();
  return NextResponse.json(getEstimatorBootstrap(user).savedEstimates);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { estimate: EstimateResult };
  const user = await getPortalSessionUser();
  return NextResponse.json(saveEstimateForMember(payload.estimate, user));
}
