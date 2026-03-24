'use client';

import { useMemo } from 'react';

import { portalActionWorkspaceBlueprints } from '../../lib/portal-action-workspace-blueprints';
import {
  PortalActionWorkspace,
  type PortalActionWorkspaceDefinition
} from '../shared/portal-action-workspace';

type EmployerWorkspaceProps = {
  sessionScopeKey: string;
};

export function EmployerDashboardWorkspaceSection({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
  const definitions = useMemo<PortalActionWorkspaceDefinition<EmployerWorkspaceProps>[]>(
    () => [
      {
        ...portalActionWorkspaceBlueprints.employer[0],
        key: 'group-dashboard',
        loader: () =>
          import('./EmployerGroupDashboardPanel').then((mod) => mod.EmployerGroupDashboardPanel),
        props: {
          sessionScopeKey
        }
      },
      {
        ...portalActionWorkspaceBlueprints.employer[1],
        key: 'renewals',
        loader: () =>
          import('./EmployerRenewalsDashboardPanel').then((mod) => mod.EmployerRenewalsDashboardPanel),
        props: {
          sessionScopeKey
        }
      },
      {
        ...portalActionWorkspaceBlueprints.employer[2],
        key: 'census-support',
        loader: () =>
          import('./EmployerCensusEnrollmentSupportDashboardPanel').then(
            (mod) => mod.EmployerCensusEnrollmentSupportDashboardPanel
          ),
        props: {
          sessionScopeKey
        }
      },
      {
        ...portalActionWorkspaceBlueprints.employer[3],
        key: 'billing-payments',
        loader: () =>
          import('./EmployerBillingPaymentsDashboardPanel').then(
            (mod) => mod.EmployerBillingPaymentsDashboardPanel
          ),
        props: {
          sessionScopeKey
        }
      },
      {
        ...portalActionWorkspaceBlueprints.employer[4],
        key: 'cases-issues',
        loader: () =>
          import('./EmployerCasesIssuesDashboardPanel').then(
            (mod) => mod.EmployerCasesIssuesDashboardPanel
          ),
        props: {
          sessionScopeKey
        }
      },
      {
        ...portalActionWorkspaceBlueprints.employer[5],
        key: 'documents-reports',
        loader: () =>
          import('./EmployerDocumentsReportsDashboardPanel').then(
            (mod) => mod.EmployerDocumentsReportsDashboardPanel
          ),
        props: {
          sessionScopeKey
        }
      }
    ],
    [sessionScopeKey]
  );

  return (
    <PortalActionWorkspace
      actions={definitions}
      emptyStateTitle="Select an employer workspace"
      emptyStateDescription="Use the workspace tabs to open group operations, renewals, census support, billing, cases, and documents only when you need them."
      persistKey={`employer-dashboard-workspace:${sessionScopeKey}`}
      sessionCacheKey={`employer-dashboard-workspace:${sessionScopeKey}`}
      sectionTitle="Employer action workspaces"
      tabListLabel="Employer workspace tabs"
    />
  );
}
