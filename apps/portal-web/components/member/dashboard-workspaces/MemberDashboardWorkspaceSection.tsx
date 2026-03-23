'use client';

import { useMemo } from 'react';

import { portalActionWorkspaceBlueprints } from '../../../lib/portal-action-workspace-blueprints';
import {
  PortalActionWorkspace,
  type PortalActionWorkspaceDefinition
} from '../../shared/portal-action-workspace';

type MemberWorkspaceProps = {
  sessionScopeKey: string;
};

export function MemberDashboardWorkspaceSection({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
  const definitions = useMemo<PortalActionWorkspaceDefinition<MemberWorkspaceProps>[]>(
    () => [
      {
        ...portalActionWorkspaceBlueprints.member[0],
        key: 'find-care',
        loader: () =>
          import('./MemberFindCareDashboardPanel').then((mod) => mod.MemberFindCareDashboardPanel),
        props: {
          sessionScopeKey
        }
      },
      {
        ...portalActionWorkspaceBlueprints.member[1],
        key: 'id-card',
        loader: () =>
          import('./MemberIdCardDashboardPanel').then((mod) => mod.MemberIdCardDashboardPanel),
        props: {
          sessionScopeKey
        }
      },
      {
        ...portalActionWorkspaceBlueprints.member[2],
        key: 'claims',
        loader: () =>
          import('./MemberClaimsDashboardPanel').then((mod) => mod.MemberClaimsDashboardPanel),
        props: {
          sessionScopeKey
        }
      },
      {
        ...portalActionWorkspaceBlueprints.member[3],
        key: 'benefits',
        loader: () =>
          import('./MemberBenefitsDashboardPanel').then((mod) => mod.MemberBenefitsDashboardPanel),
        props: {
          sessionScopeKey
        }
      },
      {
        ...portalActionWorkspaceBlueprints.member[5],
        key: 'authorizations',
        loader: () =>
          import('./MemberAuthorizationsDashboardPanel').then(
            (mod) => mod.MemberAuthorizationsDashboardPanel
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
      actionRowClassName="flex gap-3 overflow-x-auto pb-1"
      homeActionLabel="Home"
      emptyStateTitle="Select a member workspace"
      emptyStateDescription="Use the workspace tabs to open care, coverage, claims, ID card, and authorization tools only when you need them."
      persistKey={`member-dashboard-workspace:${sessionScopeKey}`}
      sessionCacheKey={`member-dashboard-workspace:${sessionScopeKey}`}
      showEmptyStateWhenInactive={false}
      sectionTitle="Member action workspaces"
      tabListLabel="Member workspace tabs"
    />
  );
}
