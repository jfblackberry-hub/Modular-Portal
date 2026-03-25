import { AdminPageLayout } from '../../../../components/admin-ui';
import { LicensingManagement } from '../../../../components/licensing-management';

export const dynamic = 'force-dynamic';

export default function AdminTenantLicensingPage() {
  return (
    <AdminPageLayout
      eyebrow="Tenant"
      title="Licensing"
      description="Manage tenant module entitlements as a separate governance view."
    >
      <LicensingManagement scope="tenant" />
    </AdminPageLayout>
  );
}
