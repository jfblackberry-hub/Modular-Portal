import type { DocumentCategory, DocumentType, EmployerDocumentRecord } from '../../lib/employer-document-center-data';
import type { ReportDefinition, ReportCategory, ReportFilters } from '../../lib/reports-analytics-data';
import { EmployerDocumentCenterLibrary } from './EmployerDocumentCenterLibrary';
import { ReportsLibrary } from './ReportsLibrary';

export function EmployerDocumentsReportsWorkspaceContent({
  categories,
  documents,
  groupedReports,
  initialFilters,
  recentDocuments,
  tenantName,
  types
}: {
  categories: DocumentCategory[];
  documents: EmployerDocumentRecord[];
  groupedReports: Record<ReportCategory, ReportDefinition[]>;
  initialFilters: ReportFilters;
  recentDocuments: EmployerDocumentRecord[];
  tenantName: string;
  types: DocumentType[];
}) {
  return (
    <div className="space-y-5">
      <EmployerDocumentCenterLibrary
        documents={documents}
        recentDocuments={recentDocuments}
        categories={categories}
        types={types}
        embedded
      />
      <ReportsLibrary
        groupedReports={groupedReports}
        initialFilters={initialFilters}
        tenantName={tenantName}
        embedded
      />
    </div>
  );
}
