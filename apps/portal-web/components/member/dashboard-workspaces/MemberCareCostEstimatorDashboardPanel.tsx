'use client';

import { CareCostEstimatorPage } from '../care-cost-estimator/CareCostEstimatorPage';
import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';

export function MemberCareCostEstimatorDashboardPanel() {
  return (
    <MemberWorkspaceDataBoundary<{
      initialData: Parameters<typeof CareCostEstimatorPage>[0]['initialData'];
    }>
      endpoint="/api/member-dashboard/workspaces/care-cost-estimator"
      label="Care cost estimator"
      render={(data) => <CareCostEstimatorPage embedded initialData={data.initialData} />}
    />
  );
}
