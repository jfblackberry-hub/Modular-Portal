import { AdminPlaceholderPage } from '../../../../components/admin-placeholder-page';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminPlatformReferenceDataPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Platform"
        title="Shared reference data"
        description="Central workspace for platform-shared lookup values, enumerations, and controlled datasets."
        highlights={[
          'Prepared route for shared configuration data used across tenants.',
          'Visible only to platform admins, as required.',
          'Fits the Configuration section without exposing tenant-only content.'
        ]}
        nextSteps={[
          'Add managed lists for shared taxonomies and operator-maintained reference values.',
          'Track reference-data changes in audit history.',
          'Support validation and publishing workflows.'
        ]}
      />
    </PlatformAdminGate>
  );
}
