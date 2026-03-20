import Link from 'next/link';

import type { ApiCatalogEntry } from '../../lib/api-catalog.types';
import {
  getAwsTone,
  getCategoryTone,
  getImplementationTone,
  getPriorityTone
} from '../../lib/api-catalog.utils';

type ApiCatalogDetailDrawerProps = {
  entry: ApiCatalogEntry | null;
  isOpen: boolean;
  onClose: () => void;
};

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function ApiCatalogDetailDrawer({
  entry,
  isOpen,
  onClose
}: ApiCatalogDetailDrawerProps) {
  if (!isOpen || !entry) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_34%,#f8fafc_100%)] px-6 py-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryTone(
                  entry.apiCategory
                )}`}
              >
                {entry.apiCategory}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getImplementationTone(
                  entry.implementationStatus
                )}`}
              >
                {entry.implementationStatus}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityTone(
                  entry.strategicPriority
                )}`}
              >
                {entry.strategicPriority}
              </span>
            </div>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
              {entry.apiName}
            </h2>
            <p className="mt-2 text-base font-semibold text-slate-700">
              {entry.vendorName} · {entry.platformName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <section className="rounded-[1.75rem] bg-slate-950 px-5 py-5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
            <p className="text-base leading-7 text-slate-200">{entry.description}</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Subcategory', entry.apiSubcategory],
              ['Readiness', entry.readinessLevel],
              ['Interface Domain', entry.integrationDomain],
              ['Documentation', entry.documentationStatus],
              ['Tenant Configurable', entry.tenantConfigurable ? 'Yes' : 'No'],
              ['Last Reviewed', entry.lastReviewed]
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#ecfeff_0%,#f8fafc_100%)] px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">AWS planning</h3>
                <p className="mt-1 text-sm text-slate-600">
                  How this API should factor into migration and target-state planning.
                </p>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${getAwsTone(
                  entry.awsRelevance
                )}`}
              >
                {entry.awsRelevance}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>AWS mapping: {entry.futureAwsMapping.join(', ')}</p>
              <p>Canonical models: {entry.canonicalModelMapping.join(', ')}</p>
              <p>Tenant enablement: {entry.tenantEnablementPotential}</p>
            </div>
          </div>

          <DetailList title="Supported modules" items={entry.supportedModules} />
          <DetailList title="Auth methods" items={entry.authTypes} />
          <DetailList title="Integration patterns" items={entry.integrationPatterns} />
          <DetailList title="Standards" items={entry.dataStandards} />
          <DetailList title="Tags" items={entry.tags} />

          <section className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
            <h3 className="text-lg font-semibold text-slate-950">Notes and future opportunity</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{entry.notes}</p>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/platform/connectivity/adapters"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Open applied APIs
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
            >
              Back to catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
