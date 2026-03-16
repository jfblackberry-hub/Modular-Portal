import { EmployerDocumentCenterLibrary } from '../../../../components/billing-enrollment/EmployerDocumentCenterLibrary';
import { getEmployerDashboard } from '../../../../lib/billing-enrollment-api';
import {
  getDocumentFilterOptions,
  getEmployerDocumentsForTenant,
  getRecentDocumentsForTenant
} from '../../../../lib/employer-document-center-data';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function EmployerDocumentCenterPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';
  const dashboard = sessionUser ? await getEmployerDashboard(sessionUser.id).catch(() => null) : null;

  const documents = getEmployerDocumentsForTenant(tenantId, dashboard?.documentCenter);
  const recentDocuments = getRecentDocumentsForTenant(tenantId, 5, dashboard?.documentCenter);
  const filters = getDocumentFilterOptions(documents);

  return (
    <EmployerDocumentCenterLibrary
      documents={documents}
      recentDocuments={recentDocuments}
      categories={filters.categories}
      types={filters.types}
    />
  );
}
