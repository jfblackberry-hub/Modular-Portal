import { getMemberDocuments } from '../../../lib/member-api';
import { formatDate, titleCase } from '../../../lib/portal-format';
import { getPortalSessionUser } from '../../../lib/portal-session';
import { EmptyState, PageHeader, SurfaceCard } from '../../../components/portal-ui';

export default async function MemberDocumentsPage() {
  const sessionUser = await getPortalSessionUser();
  const documents = await getMemberDocuments(sessionUser?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Member plugin"
        title="Documents"
        description="Plugin route for member-facing documents and notices."
      />

      {documents?.items.length ? (
        <div className="space-y-4">
          {documents.items.map((item) => (
            <SurfaceCard
              key={item.id}
              title={item.title}
              description={`${titleCase(item.documentType)} • ${item.mimeType} • ${formatDate(item.createdAt)}`}
            >
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
              >
                Open document
              </a>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Documents unavailable"
          description="Documents are unavailable until the local API is running."
        />
      )}
    </div>
  );
}
