import { redirect } from 'next/navigation';

export default async function LegacyPlatformTenantDetailPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  redirect(`/admin/tenants/${tenantId}/organization`);
}
