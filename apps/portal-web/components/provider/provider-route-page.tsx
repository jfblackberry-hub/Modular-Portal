import {
  getProviderPortalConfig,
  getProviderQuickActionsByIds,
  type ProviderPortalRouteKey,
  type ProviderPortalVariant
} from '../../config/providerPortalConfig';
import { EmptyState, PageHeader, QuickActionCard, SurfaceCard } from '../portal-ui';

export function ProviderRoutePage({
  routeKey,
  variant
}: {
  routeKey: ProviderPortalRouteKey;
  variant: ProviderPortalVariant;
}) {
  const config = getProviderPortalConfig(variant);
  const route = config.routeContent[routeKey];
  const quickActions = getProviderQuickActionsByIds(
    config,
    route.quickActionIds ?? config.quickActions.slice(0, 3).map((action) => action.id)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${variant[0].toUpperCase()}${variant.slice(1)} provider`}
        title={route.title}
        description={route.description}
      />

      {quickActions.length ? (
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
      ) : null}

      {route.highlights.length ? (
        <SurfaceCard title="Workflow highlights" description="Configured guidance for this module.">
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            {route.highlights.map((highlight) => (
              <li key={highlight} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
                {highlight}
              </li>
            ))}
          </ul>
        </SurfaceCard>
      ) : (
        <EmptyState
          title="Content coming soon"
          description="This route scaffold is in place and ready for provider workflow integration."
        />
      )}

      {routeKey === 'documents' && config.documentCategories.length ? (
        <SurfaceCard title="Document categories" description="Categories rendered from provider portal config.">
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            {config.documentCategories.map((category) => (
              <li key={category.id} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
                <p className="font-semibold text-[var(--text-primary)]">{category.label}</p>
                <p className="mt-1">{category.description}</p>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      ) : null}

      {routeKey === 'support' && config.supportLinks.length ? (
        <SurfaceCard title="Support links" description="Support navigation rendered from provider portal config.">
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            {config.supportLinks.map((link) => (
              <li key={link.id} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
                <a href={link.href} className="font-semibold text-[var(--tenant-primary-color)]">
                  {link.label}
                </a>
                <p className="mt-1 text-[var(--text-secondary)]">{link.description}</p>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
