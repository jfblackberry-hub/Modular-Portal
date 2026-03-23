import { ApiMarketplaceDetailPage } from '../../../../../../components/api-catalog/ApiMarketplaceDetailPage';
import { PlatformAdminGate } from '../../../../../../components/platform-admin-gate';

type AdminPlatformApiCatalogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminPlatformApiCatalogDetailPage({
  params
}: AdminPlatformApiCatalogDetailPageProps) {
  const { slug } = await params;

  return (
    <PlatformAdminGate>
      <ApiMarketplaceDetailPage slug={slug} />
    </PlatformAdminGate>
  );
}
