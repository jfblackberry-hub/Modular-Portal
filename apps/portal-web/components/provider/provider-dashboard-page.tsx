import {
  getProviderPortalConfig,
  getProviderQuickActionsByIds,
  type ProviderPortalVariant
} from '../../config/providerPortalConfig';
import { QuickActionCard, StatCard, SurfaceCard } from '../portal-ui';
import { PortalHeroBanner } from '../shared/portal-hero-banner';
import { MedicalProviderDashboard } from './dashboard/MedicalProviderDashboard';

export function ProviderDashboardPage({
  clinicLogoSrc,
  clinicName,
  imageSrc,
  providerName,
  variant
}: {
  clinicLogoSrc: string;
  clinicName: string;
  imageSrc: string;
  providerName: string;
  variant: ProviderPortalVariant;
}) {
  const config = getProviderPortalConfig(variant);

  if (variant === 'medical' && config.featureFlags.medicalProviderDashboard) {
    return (
      <MedicalProviderDashboard
        clinicLogoSrc={clinicLogoSrc}
        clinicName={clinicName}
        config={config}
        imageSrc={imageSrc}
        providerName={providerName}
      />
    );
  }

  const route = config.routeContent.dashboard;
  const quickActions = getProviderQuickActionsByIds(
    config,
    route.quickActionIds ?? config.quickActions.slice(0, 4).map((item) => item.id)
  );

  return (
    <div className="space-y-6">
      <PortalHeroBanner
        eyebrow={`${variant[0].toUpperCase()}${variant.slice(1)} provider`}
        title={route.title}
        description={route.description}
        imageSrc={imageSrc}
        imageDecorative
        priority
      />

      {config.dashboardSections.map((section) => (
        <section key={section.id} className="space-y-4">
          <SurfaceCard title={section.title} description={section.description}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {section.widgets.map((widget) => (
                <StatCard
                  key={widget.id}
                  label={widget.label}
                  value={widget.value}
                  detail={widget.detail}
                  tone={widget.tone}
                />
              ))}
            </div>
          </SurfaceCard>
        </section>
      ))}

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

      <SurfaceCard title="Daily focus" description="Config-driven operational priorities for today.">
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          {route.highlights.map((highlight) => (
            <li key={highlight} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              {highlight}
            </li>
          ))}
        </ul>
      </SurfaceCard>
    </div>
  );
}
