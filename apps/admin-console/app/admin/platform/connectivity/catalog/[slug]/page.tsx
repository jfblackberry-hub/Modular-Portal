import { notFound } from 'next/navigation';

import { PlatformAdminGate } from '../../../../../../components/platform-admin-gate';
import { ApiMarketplaceDetailPage } from '../../../../../../components/api-catalog/ApiMarketplaceDetailPage';
import {
  API_MARKETPLACE_CATALOG,
  getMarketplaceEntryBySlug
} from '../../../../../../lib/api-marketplace.data';
import { getRelatedMarketplaceEntries } from '../../../../../../lib/api-marketplace.utils';

type AdminPlatformApiCatalogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminPlatformApiCatalogDetailPage({
  params
}: AdminPlatformApiCatalogDetailPageProps) {
  const { slug } = await params;
  const entry = getMarketplaceEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const relatedEntries = getRelatedMarketplaceEntries(API_MARKETPLACE_CATALOG, entry);

  return (
    <PlatformAdminGate>
      <ApiMarketplaceDetailPage entry={entry} relatedEntries={relatedEntries} />
    </PlatformAdminGate>
  );
}
