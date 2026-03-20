import Link from 'next/link';

import type { ApiMarketplaceEntry } from '../../lib/api-marketplace.types';

type ApiMarketplaceDetailPageProps = {
  entry: ApiMarketplaceEntry;
  relatedEntries: ApiMarketplaceEntry[];
};

function DetailPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
      {label}
    </span>
  );
}

export function ApiMarketplaceDetailPage({
  entry,
  relatedEntries
}: ApiMarketplaceDetailPageProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#12304d_46%,#164e63_100%)] px-7 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <DetailPill label={entry.category} />
              <DetailPill label={entry.lifecycleStatus} />
              <DetailPill label={entry.apiType} />
              <DetailPill label={entry.authType} />
            </div>
            <h1 className="mt-5 text-[2.5rem] font-semibold tracking-[-0.05em] text-white">
              {entry.name}
            </h1>
            <p className="mt-2 text-base font-semibold text-cyan-100">
              {entry.publisher} · {entry.platformName}
            </p>
            <p className="mt-4 max-w-3xl text-[1rem] leading-7 text-slate-200">
              {entry.fullDescription}
            </p>
          </div>

          <div className="min-w-[18rem] rounded-[1.5rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-300">
              Marketplace availability
            </p>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-sm text-slate-300">Version</p>
                <p className="mt-1 text-lg font-semibold text-white">{entry.version}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Last updated</p>
                <p className="mt-1 text-lg font-semibold text-white">{entry.lastUpdated}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Environments</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {entry.environmentAvailability.join(' · ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {entry.documentationUrl ? (
            <a
              href={entry.documentationUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
            >
              Documentation
            </a>
          ) : (
            <span className="rounded-full bg-white/8 px-5 py-3 text-sm font-semibold text-slate-200">
              Documentation link not connected yet
            </span>
          )}
          {entry.specUrl ? (
            <a
              href={entry.specUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
            >
              Open spec
            </a>
          ) : (
            <span className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white/85">
              Spec link coming soon
            </span>
          )}
          <Link
            href="/admin/platform/connectivity/catalog"
            className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
          >
            Back to marketplace
          </Link>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_23rem]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">What this API enables</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {entry.capabilitySummary.map((capability) => (
                <div key={capability} className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900">
                  {capability}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Common use cases</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              {entry.useCases.map((useCase) => (
                <li key={useCase} className="rounded-[1.15rem] bg-slate-50 px-4 py-4">
                  {useCase}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Capability summary</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Auth method
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">{entry.authType}</p>
              </div>
              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Standards
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {entry.standards.slice(0, 3).join(' · ')}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Audience
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {entry.audience.join(' · ')}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Readiness
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">{entry.readinessLabel}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">Sample request</h2>
                <pre className="mt-4 overflow-x-auto rounded-[1.35rem] bg-slate-950 p-4 text-sm leading-6 text-slate-200">
{`GET /${entry.slug}/v1/resources
Authorization: Bearer <token>
Accept: application/json`}
                </pre>
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">Sample response</h2>
                <pre className="mt-4 overflow-x-auto rounded-[1.35rem] bg-slate-950 p-4 text-sm leading-6 text-slate-200">
{`{
  "api": "${entry.name}",
  "status": "${entry.lifecycleStatus}",
  "publisher": "${entry.publisher}",
  "sandboxAvailable": ${entry.sandboxAvailable}
}`}
                </pre>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Marketplace metadata</h2>
            <div className="mt-4 space-y-4 text-sm">
              {[
                ['Publisher', entry.publisher],
                ['Platform', entry.platformName],
                ['Status', entry.lifecycleStatus],
                ['Priority', entry.strategicPriority],
                ['Implementation', entry.implementationStatus],
                ['Sandbox', entry.sandboxAvailable ? 'Available' : 'Not available']
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Integration notes</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{entry.integrationNotes}</p>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Related APIs</h2>
            <div className="mt-4 space-y-3">
              {relatedEntries.map((relatedEntry) => (
                <Link
                  key={relatedEntry.slug}
                  href={`/admin/platform/connectivity/catalog/${relatedEntry.slug}`}
                  className="block rounded-[1.2rem] border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <p className="font-semibold text-slate-950">{relatedEntry.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{relatedEntry.publisherSummary}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
