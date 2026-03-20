'use client';

import { useMemo } from 'react';

import { portalActionWorkspaceBlueprints } from '../../lib/portal-action-workspace-blueprints';
import {
  PortalActionWorkspace,
  type PortalActionWorkspaceDefinition
} from '../shared/portal-action-workspace';

type EmptyProps = Record<string, never>;

export function EmployerDashboardWorkspaceSection() {
  const definitions = useMemo<PortalActionWorkspaceDefinition<EmptyProps>[]>(
    () => [
      {
        ...portalActionWorkspaceBlueprints.employer[0],
        key: 'group-dashboard',
        loader: () =>
          import('./EmployerGroupDashboardPanel').then((mod) => mod.EmployerGroupDashboardPanel),
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.employer[1],
        key: 'renewals',
        loader: () =>
          import('./EmployerRenewalsDashboardPanel').then((mod) => mod.EmployerRenewalsDashboardPanel),
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.employer[2],
        key: 'census-support',
        loader: () =>
          import('./EmployerCensusEnrollmentSupportDashboardPanel').then(
            (mod) => mod.EmployerCensusEnrollmentSupportDashboardPanel
          ),
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.employer[3],
        key: 'billing-payments',
        loader: () =>
          import('./EmployerBillingPaymentsDashboardPanel').then(
            (mod) => mod.EmployerBillingPaymentsDashboardPanel
          ),
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.employer[4],
        key: 'cases-issues',
        loader: () =>
          import('./EmployerCasesIssuesDashboardPanel').then(
            (mod) => mod.EmployerCasesIssuesDashboardPanel
          ),
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.employer[5],
        key: 'documents-reports',
        loader: () =>
          import('./EmployerDocumentsReportsDashboardPanel').then(
            (mod) => mod.EmployerDocumentsReportsDashboardPanel
          ),
        props: {}
      }
    ],
    []
  );

  return (
    <PortalActionWorkspace
      actions={definitions}
      emptyStateTitle="Select an employer workspace"
      emptyStateDescription="Use the action buttons to open group operations, renewals, census support, billing, cases, and documents only when you need them."
      persistKey="employer-dashboard-workspace"
      sectionTitle="Employer action workspaces"
    />
  );
}
