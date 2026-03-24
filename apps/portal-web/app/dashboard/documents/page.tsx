import {
  EmptyState,
  SurfaceCard
} from '../../../components/portal-ui';
import { PortalHeroBanner } from '../../../components/shared/portal-hero-banner';
import { getMemberDocuments } from '../../../lib/member-api';
import { formatDate, titleCase } from '../../../lib/portal-format';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import {
  getPortalSessionAccessToken,
  getPortalSessionUser
} from '../../../lib/portal-session';

export default async function DocumentsPage() {
  const sessionUser = await getPortalSessionUser();
  const accessToken = await getPortalSessionAccessToken();
  const documents = await getMemberDocuments(accessToken ?? undefined);
  const items = documents?.items ?? [];
  const documentsHeroImage = getPortalImageSrc('documentsHero', {
    tenantBrandingConfig: sessionUser?.tenant.brandingConfig
  });

  return (
    <div className="space-y-6">
      <PortalHeroBanner
        eyebrow="Documents"
        title="Documents and notices"
        description="Access explanation of benefits, letters, and uploaded items from a clean document center."
        imageSrc={documentsHeroImage}
        imageDecorative
        priority
      />

      <SurfaceCard
        title="Document center"
        description="Search, filter, and open documents relevant to your plan and recent activity."
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
          <input className="portal-input px-4 py-3 text-sm outline-none" placeholder="Search documents" aria-label="Search documents" />
          <select className="portal-input px-4 py-3 text-sm outline-none" aria-label="Filter documents by type">
            <option>All document types</option>
            <option>EOB</option>
            <option>ID card</option>
            <option>Letters</option>
          </select>
          <select className="portal-input px-4 py-3 text-sm outline-none" aria-label="Filter documents by date">
            <option>Last 12 months</option>
            <option>Last 30 days</option>
            <option>This year</option>
          </select>
          <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]">
            Export
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No documents available"
            description="Documents will appear here after the local member API is available."
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {titleCase(item.documentType)} • {item.mimeType} • {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Open
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
