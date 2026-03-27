import { redirect } from 'next/navigation';

export default async function LegacyPlatformApiCatalogDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/admin/shared/api-catalog/${slug}`);
}
