import { NextResponse } from 'next/server';

import { type EstimateSearchInput,runCareCostEstimate } from '../../../../lib/care-cost-estimator/service';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export async function POST(request: Request) {
  const payload = (await request.json()) as EstimateSearchInput;
  const user = await getPortalSessionUser();
  return NextResponse.json(runCareCostEstimate(payload, user));
}
