'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type {
  ProviderOperationsDashboardContract,
  ProviderOperationsWidgetContract
} from '@payer-portal/api-contracts';

import type { ProviderPortalConfig } from '../../../config/providerPortalConfig';
import type { PortalSessionUser } from '../../../lib/portal-session';
import { useProviderOperationsLiveDashboard } from '../../../lib/use-provider-operations-live-dashboard';
import { QuickActionCard, StatusBadge, SurfaceCard } from '../../portal-ui';
import { PortalHeroBanner } from '../../shared/portal-hero-banner';

type ProviderOperationsWidgetRenderer = (widget: ProviderOperationsWidgetContract) => ReactNode;

function toTitleCase(value: string) {
  return value
    .split('_')
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ');
}

function ScopeBadge({
  hasActiveOrganizationUnit,
  scopeMode
}: {
  hasActiveOrganizationUnit: boolean;
  scopeMode: ProviderOperationsWidgetContract['scope']['mode'];
}) {
  const label =
    scopeMode === 'rollup'
      ? 'Roll-up view'
      : hasActiveOrganizationUnit
        ? 'Active organization unit scope'
        : 'Tenant scope';

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {label}
    </span>
  );
}

function WidgetFrame({ widget }: { widget: ProviderOperationsWidgetContract }) {
  return (
    <SurfaceCard
      title={widget.title}
      description={widget.description}
      action={
        <ScopeBadge
          hasActiveOrganizationUnit={widget.scope.activeOrganizationUnitId !== null}
          scopeMode={widget.scope.mode}
        />
      }
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">
              {widget.summary}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {widget.scope.mode === 'rollup'
                ? 'Leadership roll-up across authorized organization units.'
                : 'Operational view scoped to the active organization unit in session.'}
            </p>
          </div>
          <StatusBadge
            label={
              widget.tone === 'success'
                ? 'On Track'
                : widget.tone === 'warning'
                  ? 'Needs Review'
                  : widget.tone === 'danger'
                    ? 'Action Needed'
                    : widget.tone === 'info'
                      ? 'Active'
                      : 'Monitoring'
            }
          />
        </div>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{widget.detail}</p>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          {widget.highlights.map((highlight: string) => (
            <li
              key={highlight}
              className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2"
            >
              {highlight}
            </li>
          ))}
        </ul>
        {widget.href && widget.ctaLabel ? (
          <Link
            href={widget.href}
            className="inline-flex items-center text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            {widget.ctaLabel}
          </Link>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

const PROVIDER_OPERATIONS_WIDGET_REGISTRY: Record<
  ProviderOperationsWidgetContract['id'],
  ProviderOperationsWidgetRenderer
> = {
  scheduling: (widget) => <WidgetFrame widget={widget} />,
  authorizations: (widget) => <WidgetFrame widget={widget} />,
  claims: (widget) => <WidgetFrame widget={widget} />,
  billing: (widget) => <WidgetFrame widget={widget} />,
  utilization: (widget) => <WidgetFrame widget={widget} />
};

export function ProviderOperationsDashboard({
  clinicLogoSrc,
  clinicName,
  config,
  dashboard,
  imageSrc,
  providerName,
  user
}: {
  clinicLogoSrc: string;
  clinicName: string;
  config: ProviderPortalConfig;
  dashboard: ProviderOperationsDashboardContract;
  imageSrc: string;
  providerName: string;
  user: PortalSessionUser;
}) {
  const quickActions = config.quickActions.slice(0, 4);
  const activeOrganizationUnit = user.session.activeOrganizationUnit;
  const personaLabel = toTitleCase(user.session.personaType);
  const { dashboard: liveDashboard, refreshState } =
    useProviderOperationsLiveDashboard(dashboard);

  return (
    <div className="space-y-6">
      <PortalHeroBanner
        eyebrow="Provider operations"
        title="Provider operations dashboard"
        description="Provider Operations widgets consume normalized platform contracts only. Persona mapping controls visibility while the data layer enforces active Organization Unit scope and approved roll-up access."
        imageSrc={imageSrc}
        imageDecorative
        priority
        contentFooter={
          <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
            <span className="rounded-full bg-white/85 px-3 py-1 font-medium text-[var(--text-primary)]">
              {clinicName}
            </span>
            <span className="rounded-full bg-white/85 px-3 py-1 font-medium text-[var(--text-primary)]">
              {providerName}
            </span>
            <span className="rounded-full bg-white/85 px-3 py-1 font-medium text-[var(--text-primary)]">
              Persona: {personaLabel}
            </span>
            <span className="rounded-full bg-white/85 px-3 py-1 font-medium text-[var(--text-primary)]">
              Scope: {activeOrganizationUnit?.name ?? 'Tenant'}
            </span>
            <span className="rounded-full bg-white/85 px-3 py-1 font-medium text-[var(--text-primary)]">
              Source: {dashboard.source}
            </span>
            <span className="rounded-full bg-white/85 px-3 py-1 font-medium text-[var(--text-primary)]">
              Refresh: {refreshState === 'live' ? 'Live updates' : 'Auto-refresh fallback'}
            </span>
          </div>
        }
        cornerOverlayContent={
          clinicLogoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clinicLogoSrc}
              alt={`${clinicName} logo`}
              className="h-12 w-auto rounded-xl bg-white/85 p-2 shadow-sm"
            />
          ) : null
        }
      />

      <section className="grid gap-4 xl:grid-cols-2" aria-label="Provider operations widgets">
        {liveDashboard.widgets.map((widget: ProviderOperationsWidgetContract) => (
          <div key={widget.id} data-widget-id={widget.id}>
            {PROVIDER_OPERATIONS_WIDGET_REGISTRY[widget.id](widget)}
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => (
          <QuickActionCard
            key={action.id}
            href={action.href}
            label={action.label}
            description={action.description}
            icon={action.icon}
          />
        ))}
      </section>
    </div>
  );
}
