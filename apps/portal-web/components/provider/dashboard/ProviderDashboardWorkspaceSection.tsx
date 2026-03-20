'use client';

import { useMemo } from 'react';

import type {
  ProviderPortalConfig,
  ProviderPortalVariant
} from '../../../config/providerPortalConfig';
import { portalActionWorkspaceBlueprints } from '../../../lib/portal-action-workspace-blueprints';
import {
  PortalActionWorkspace,
  type PortalActionWorkspaceDefinition
} from '../../shared/portal-action-workspace';

type ProviderWorkspaceProps = {
  config: ProviderPortalConfig;
  variant: ProviderPortalVariant;
  embedded: boolean;
};

type ProviderWorkspaceKey = 'eligibility' | 'authorizations' | 'claims' | 'payments';

export function ProviderDashboardWorkspaceSection({
  config,
  variant
}: {
  config: ProviderPortalConfig;
  variant: ProviderPortalVariant;
}) {
  const workspaceDefinitions = useMemo<
    PortalActionWorkspaceDefinition<ProviderWorkspaceProps>[]
  >(
    () => [
      {
        ...portalActionWorkspaceBlueprints.provider[0],
        key: 'eligibility' as ProviderWorkspaceKey,
        loader: () =>
          import('../eligibility/ProviderEligibilityPage').then((mod) => mod.ProviderEligibilityPage),
        props: {
          config,
          variant,
          embedded: true
        }
      },
      {
        ...portalActionWorkspaceBlueprints.provider[1],
        key: 'authorizations' as ProviderWorkspaceKey,
        loader: () =>
          import('../authorizations/ProviderAuthorizationsPage').then(
            (mod) => mod.ProviderAuthorizationsPage
          ),
        props: {
          config,
          variant,
          embedded: true
        }
      },
      {
        ...portalActionWorkspaceBlueprints.provider[2],
        key: 'claims' as ProviderWorkspaceKey,
        loader: () =>
          import('../claims/ProviderClaimsPage').then((mod) => mod.ProviderClaimsPage),
        props: {
          config,
          variant,
          embedded: true
        }
      },
      {
        ...portalActionWorkspaceBlueprints.provider[3],
        key: 'payments' as ProviderWorkspaceKey,
        loader: () =>
          import('../payments/ProviderPaymentsPage').then((mod) => mod.ProviderPaymentsPage),
        props: {
          config,
          variant,
          embedded: true
        }
      }
    ],
    [config, variant]
  );

  return (
    <PortalActionWorkspace
      actions={workspaceDefinitions}
      emptyStateTitle="Select a provider workspace"
      emptyStateDescription="Use the action buttons to open eligibility, authorizations, claims, or payments only when you need them. Loaded workspaces stay hydrated for this page session."
      persistKey={`provider-dashboard-workspace-${variant}`}
      sectionTitle="Provider action workspaces"
    />
  );
}
