import { ApiMarketplaceDetailPage } from '../../../../../components/api-catalog/ApiMarketplaceDetailPage';
import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';

export default async function AdminSharedApiCatalogDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PlatformAdminGate>
      <ApiMarketplaceDetailPage slug={slug} />
    </PlatformAdminGate>
  );
}
