import { AdminPageLayout } from '../../../../components/admin-ui';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { SectionCard } from '../../../../components/section-card';
import {
  adminConsolePublicOrigin,
  apiPublicOrigin,
  portalPublicOrigin
} from '../../../../lib/server-runtime';

export default function AdminPlatformSettingsPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Platform"
        title="Platform settings"
        description="Shared operating defaults for the multi-tenant platform and platform operator workflows."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SectionCard title="Default quotas" description="New tenant defaults used during provisioning.">
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

          <SectionCard title="Operational notes" description="Current local-development platform conventions.">
            <ul className="space-y-2 text-sm text-admin-muted">
              <li>API: <code>{apiPublicOrigin}</code></li>
              <li>Portal: <code>{portalPublicOrigin}</code></li>
              <li>Admin console: <code>{adminConsolePublicOrigin}</code></li>
            </ul>
          </SectionCard>
        </div>
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
