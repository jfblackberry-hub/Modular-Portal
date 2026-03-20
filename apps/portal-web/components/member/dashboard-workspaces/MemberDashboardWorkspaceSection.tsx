'use client';

import { useMemo } from 'react';

import { portalActionWorkspaceBlueprints } from '../../../lib/portal-action-workspace-blueprints';
import {
  PortalActionWorkspace,
  type PortalActionWorkspaceDefinition
} from '../../shared/portal-action-workspace';

type EmptyProps = Record<string, never>;

export function MemberDashboardWorkspaceSection() {
  const definitions = useMemo<PortalActionWorkspaceDefinition<EmptyProps>[]>(
    () => [
      {
        ...portalActionWorkspaceBlueprints.member[0],
        key: 'find-care',
        loader: () =>
          import('./MemberFindCareDashboardPanel').then((mod) => mod.MemberFindCareDashboardPanel),
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.member[1],
        key: 'id-card',
        loader: () =>
          import('./MemberIdCardDashboardPanel').then((mod) => mod.MemberIdCardDashboardPanel),
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.member[2],
        key: 'claims',
        loader: () =>
          import('./MemberClaimsDashboardPanel').then((mod) => mod.MemberClaimsDashboardPanel),
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.member[3],
        key: 'benefits',
        loader: () =>
          import('./MemberBenefitsDashboardPanel').then((mod) => mod.MemberBenefitsDashboardPanel),
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.member[5],
        key: 'authorizations',
        loader: () =>
          import('./MemberAuthorizationsDashboardPanel').then(
            (mod) => mod.MemberAuthorizationsDashboardPanel
          ),
        props: {}
      }
    ],
    []
  );

  return (
    <PortalActionWorkspace
      actions={definitions}
      actionRowClassName="flex gap-3 overflow-x-auto pb-1"
      homeActionLabel="Home"
      emptyStateTitle="Select a member workspace"
      emptyStateDescription="Use the action buttons to open care, coverage, claims, ID card, and authorization workspaces only when you need them."
      showEmptyStateWhenInactive={false}
      sectionTitle="Member action workspaces"
    />
  );
}
