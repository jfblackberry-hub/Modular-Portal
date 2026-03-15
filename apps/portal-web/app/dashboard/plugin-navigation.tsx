import Link from 'next/link';

import { SurfaceCard } from '../../components/portal-ui';
import { getEnabledPlugins } from '../../lib/plugins';

export async function PluginNavigation() {
  const plugins = await getEnabledPlugins();

  if (plugins.length === 0) {
    return (
      <SurfaceCard
        title="Programs"
        description="Enable a plugin feature flag in the admin console and it will appear here automatically."
      >
        <p className="text-sm text-[var(--text-secondary)]">No enabled plugins right now.</p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      title="Programs"
      description="Navigation is driven by plugin manifests and feature flags."
    >
      <div className="flex flex-wrap gap-3">
        {plugins.flatMap((plugin) =>
          plugin.navigation.map((item) => (
            <Link
              key={`${plugin.id}:${item.href}`}
              href={item.href}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-sky-50"
            >
              {item.label}
            </Link>
          ))
        )}
      </div>
    </SurfaceCard>
  );
}
