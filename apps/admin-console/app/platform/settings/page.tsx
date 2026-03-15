import { PlatformAdminGate } from '../../../components/platform-admin-gate';
import { SectionCard } from '../../../components/section-card';

export default function PlatformSettingsPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Platform settings
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Shared operating defaults for the multi-tenant platform and platform
            operator workflows.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SectionCard
            title="Default quotas"
            description="New tenant defaults used during provisioning."
          >
            <ul className="space-y-2 text-sm text-admin-muted">
              <li>Member quota baseline: 500</li>
              <li>Storage quota baseline: 25 GB</li>
              <li>Onboarding status is the default lifecycle state</li>
            </ul>
          </SectionCard>

          <SectionCard
            title="Operator guardrails"
            description="Platform-only actions remain restricted to platform admins."
          >
            <ul className="space-y-2 text-sm text-admin-muted">
              <li>Tenant creation is platform-only</li>
              <li>Tenant suspend/reactivate is platform-only</li>
              <li>Cross-tenant audit access is platform-only</li>
            </ul>
          </SectionCard>

          <SectionCard
            title="Operational notes"
            description="Current local-development platform conventions."
          >
            <ul className="space-y-2 text-sm text-admin-muted">
              <li>API: `localhost:3002`</li>
              <li>Portal: `localhost:3000`</li>
              <li>Admin console: `localhost:3003`</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </PlatformAdminGate>
  );
}
