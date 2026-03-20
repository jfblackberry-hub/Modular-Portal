import { AdminPageLayout } from '../../../../components/admin-ui';
import { DocumentManagement } from '../../../documents/document-management';

export default function AdminTenantDocumentsPage() {
  return (
    <AdminPageLayout
      eyebrow="Tenant Administration"
      title="Tenant documents"
      description="Upload tenant-owned files, review metadata, and download stored artifacts within the active tenant scope."
    >
      <DocumentManagement />
    </AdminPageLayout>
  );
}
