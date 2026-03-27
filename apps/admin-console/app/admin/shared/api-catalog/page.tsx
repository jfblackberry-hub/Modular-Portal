import { ApiCatalogPage } from '../../../../components/api-catalog/ApiCatalogPage';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminSharedApiCatalogPage() {
  return (
    <PlatformAdminGate>
      <ApiCatalogPage />
    </PlatformAdminGate>
  );
}
