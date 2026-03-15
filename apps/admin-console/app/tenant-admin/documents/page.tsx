import { DocumentManagement } from '../../documents/document-management';

export default function TenantAdminDocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
          Tenant Admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
          Tenant documents
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-admin-muted">
          Upload tenant-owned files, review document metadata, and download stored
          artifacts within the active tenant scope.
        </p>
      </div>

      <DocumentManagement />
    </div>
  );
}
