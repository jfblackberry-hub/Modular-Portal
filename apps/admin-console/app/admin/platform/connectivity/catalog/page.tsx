import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { ApiCatalogPage } from '../../../../../components/api-catalog/ApiCatalogPage';

export default function AdminPlatformApiCatalogPage() {
  return (
    <PlatformAdminGate>
      <ApiCatalogPage />
    </PlatformAdminGate>
  );
}
