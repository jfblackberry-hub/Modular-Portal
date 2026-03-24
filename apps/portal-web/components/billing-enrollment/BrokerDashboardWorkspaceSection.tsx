'use client';

import type { ComponentType } from 'react';
import { useMemo } from 'react';

import type { BrokerCommissionRecord } from '../../lib/broker-operations-data';
import type { BrokerGroup } from '../../lib/broker-portfolio-data';
import type { BrokerQuote, BrokerRenewal } from '../../lib/broker-sales-workspace-data';
import { portalActionWorkspaceBlueprints } from '../../lib/portal-action-workspace-blueprints';
import {
  PortalActionWorkspace,
  type PortalActionWorkspaceDefinition
} from '../shared/portal-action-workspace';

type EmptyProps = Record<string, never>;

type BrokerIndividualWorkspaceProps = {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  highlights: string[];
  title: string;
};

function getBookOfBusinessFilterOptions(groups: BrokerGroup[]) {
  return {
    renewalMonths: Array.from(
      new Set(
        groups.map((group) =>
          new Date(`${group.renewalDate}T00:00:00`).toLocaleDateString('en-US', {
            month: 'long'
          })
        )
      )
    ).sort(),
    linesOfBusiness: Array.from(new Set(groups.map((group) => group.lineOfBusiness))).sort(),
    statuses: Array.from(new Set(groups.map((group) => group.status))).sort(),
    regions: Array.from(new Set(groups.map((group) => group.region))).sort(),
    assignedReps: Array.from(new Set(groups.map((group) => group.assignedRep))).sort()
  };
}

function getBrokerIndividualWorkspaces() {
  return [
    {
      ...portalActionWorkspaceBlueprints.brokerIndividual[0],
      key: 'prospects',
      ctaHref: '/broker/quotes',
      ctaLabel: 'Review quote pipeline',
      title: 'Prospects',
      description:
        'Track new individual and small-group opportunities, early-stage outreach, and intake readiness without leaving the dashboard.',
      highlights: [
        'Review warm prospects, pending intake details, and outreach priorities in one place.',
        'Keep top-of-funnel work separate from active enrollments and service cases.',
        'Stay aligned on which opportunities are ready to move into quoting workflows.'
      ]
    },
    {
      ...portalActionWorkspaceBlueprints.brokerIndividual[1],
      key: 'applications',
      ctaHref: '/broker/tasks',
      ctaLabel: 'Open application queue',
      title: 'Applications',
      description:
        'Organize submitted applications, missing information, and follow-up steps for broker-assisted enrollments.',
      highlights: [
        'Monitor application packets that still need signatures, documents, or employer confirmation.',
        'Keep broker follow-up visible without mixing it into commission or renewal views.',
        'Route application cleanup work into the broader broker case queue when needed.'
      ]
    },
    {
      ...portalActionWorkspaceBlueprints.brokerIndividual[2],
      key: 'enrollments',
      ctaHref: '/broker/enrollments',
      ctaLabel: 'Review enrollments',
      title: 'Enrollments',
      description:
        'Follow individual enrollment timing, effective-date readiness, and handoff risks from the same dashboard shell.',
      highlights: [
        'Surface enrollments approaching effective dates or waiting on verification.',
        'Keep implementation and readiness signals visible for broker follow-up.',
        'Use the full enrollment route for deeper case review when needed.'
      ]
    },
    {
      ...portalActionWorkspaceBlueprints.brokerIndividual[3],
      key: 'plans',
      ctaHref: '/broker/support',
      ctaLabel: 'Open support resources',
      title: 'Plans',
      description:
        'Review plan guidance, product talking points, and coverage positioning that brokers need during prospect and enrollment conversations.',
      highlights: [
        'Keep plan positioning notes and product guidance close to the sales workflow.',
        'Separate plan guidance from prospect and application work to reduce context switching.',
        'Use support resources for the latest enablement and coverage references.'
      ]
    }
  ] satisfies Array<
    (typeof portalActionWorkspaceBlueprints.brokerIndividual)[number] &
      BrokerIndividualWorkspaceProps
  >;
}

function createStaticWorkspaceComponent<TProps extends object>(
  render: ComponentType<TProps>,
  props: TProps
) {
  return function StaticWorkspaceComponent() {
    const WorkspaceComponent = render;

    return <WorkspaceComponent {...props} />;
  };
}

type BrokerEmployerWorkspaceDataResolvers = {
  loadBookOfBusinessData: () => Promise<{
    groups: BrokerGroup[];
    filterOptions: ReturnType<typeof getBookOfBusinessFilterOptions>;
  }>;
  loadRenewalsData: () => Promise<{
    groupedRenewals: Record<string, BrokerRenewal[]>;
  }>;
  loadQuotesData: () => Promise<{
    quotes: BrokerQuote[];
  }>;
  loadCommissionsData: () => Promise<{
    records: BrokerCommissionRecord[];
  }>;
};

export function createBrokerEmployerWorkspaceDataResolvers(
  overrides: Partial<BrokerEmployerWorkspaceDataResolvers> = {}
) {
  return {
    loadBookOfBusinessData:
      overrides.loadBookOfBusinessData ??
      (async () => {
        const { getBrokerPortfolioGroups } = await import('../../lib/broker-portfolio-data');
        const groups = getBrokerPortfolioGroups();

        return {
          groups,
          filterOptions: getBookOfBusinessFilterOptions(groups)
        };
      }),
    loadRenewalsData:
      overrides.loadRenewalsData ??
      (async () => {
        const { getBrokerRenewalsGroupedByWindow } = await import('../../lib/broker-sales-workspace-data');
        return {
          groupedRenewals: getBrokerRenewalsGroupedByWindow()
        };
      }),
    loadQuotesData:
      overrides.loadQuotesData ??
      (async () => {
        const { getBrokerQuotes } = await import('../../lib/broker-sales-workspace-data');
        return {
          quotes: getBrokerQuotes()
        };
      }),
    loadCommissionsData:
      overrides.loadCommissionsData ??
      (async () => {
        const { getBrokerCommissionRecords } = await import('../../lib/broker-operations-data');
        return {
          records: getBrokerCommissionRecords()
        };
      })
  } satisfies BrokerEmployerWorkspaceDataResolvers;
}

export function BrokerDashboardWorkspaceSection({
  sessionScopeKey,
  workspaceVariant
}: {
  sessionScopeKey: string;
  workspaceVariant: 'brokerEmployer' | 'brokerIndividual';
}) {
  const dataResolvers = useMemo(() => createBrokerEmployerWorkspaceDataResolvers(), []);
  const employerDefinitions = useMemo<
    PortalActionWorkspaceDefinition<EmptyProps>[]
  >(
    () => [
      {
        ...portalActionWorkspaceBlueprints.brokerEmployer[0],
        key: 'book-of-business',
        loader: async () => {
          const [mod, workspaceData] = await Promise.all([
            import('./BrokerBookOfBusinessPage'),
            dataResolvers.loadBookOfBusinessData()
          ]);
          const { groups, filterOptions } = workspaceData;

          return createStaticWorkspaceComponent(mod.BrokerBookOfBusinessPage, {
            groups,
            filterOptions
          });
        },
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.brokerEmployer[1],
        key: 'renewals',
        loader: async () => {
          const [mod, workspaceData] = await Promise.all([
            import('./BrokerRenewalsWorkspacePage'),
            dataResolvers.loadRenewalsData()
          ]);
          const { groupedRenewals } = workspaceData;

          return createStaticWorkspaceComponent(mod.BrokerRenewalsWorkspacePage, {
            groupedRenewals
          });
        },
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.brokerEmployer[2],
        key: 'quotes',
        loader: async () => {
          const [mod, workspaceData] = await Promise.all([
            import('./BrokerQuotesWorkspacePage'),
            dataResolvers.loadQuotesData()
          ]);
          const { quotes } = workspaceData;

          return createStaticWorkspaceComponent(mod.BrokerQuotesWorkspacePage, {
            quotes
          });
        },
        props: {}
      },
      {
        ...portalActionWorkspaceBlueprints.brokerEmployer[3],
        key: 'commissions',
        loader: async () => {
          const [mod, workspaceData] = await Promise.all([
            import('./BrokerCommissionsWorkspacePage'),
            dataResolvers.loadCommissionsData()
          ]);
          const { records } = workspaceData;

          return createStaticWorkspaceComponent(mod.BrokerCommissionsWorkspacePage, {
            records
          });
        },
        props: {}
      }
    ],
    [dataResolvers]
  );

  const individualDefinitions = useMemo<
    PortalActionWorkspaceDefinition<EmptyProps>[]
  >(
    () =>
      getBrokerIndividualWorkspaces().map((workspace) => ({
        ...workspace,
        loader: () =>
          import('./BrokerIndividualWorkspacePage').then((mod) =>
            createStaticWorkspaceComponent(mod.BrokerIndividualWorkspacePage, {
              ctaHref: workspace.ctaHref,
              ctaLabel: workspace.ctaLabel,
              description: workspace.description,
              highlights: workspace.highlights,
              title: workspace.title
            })
          ),
        props: {}
      })),
    []
  );

  const prefix =
    workspaceVariant === 'brokerEmployer'
      ? 'broker-employer-dashboard-workspace'
      : 'broker-individual-dashboard-workspace';

  if (workspaceVariant === 'brokerEmployer') {
    return (
      <PortalActionWorkspace
        actions={employerDefinitions}
        emptyStateTitle="Select a broker workspace"
        emptyStateDescription="Use the workspace tabs to load broker portfolio, quote, renewal, and commission workspaces only when you need them."
        persistKey={`${prefix}:${sessionScopeKey}`}
        sessionCacheKey={`${prefix}:${sessionScopeKey}`}
        sectionTitle="Broker action workspaces"
        tabListLabel="Broker workspace tabs"
      />
    );
  }

  return (
    <PortalActionWorkspace
      actions={individualDefinitions}
      emptyStateTitle="Select a broker workspace"
      emptyStateDescription="Use the workspace tabs to load broker portfolio, quote, enrollment, and compensation workspaces only when you need them."
      persistKey={`${prefix}:${sessionScopeKey}`}
      sessionCacheKey={`${prefix}:${sessionScopeKey}`}
      sectionTitle="Broker action workspaces"
      tabListLabel="Broker workspace tabs"
    />
  );
}
