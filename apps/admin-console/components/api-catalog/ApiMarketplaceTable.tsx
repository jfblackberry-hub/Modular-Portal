import Link from 'next/link';

import type { ApiMarketplaceEntry } from '../../lib/api-marketplace.types';

type ApiMarketplaceTableProps = {
  entries: ApiMarketplaceEntry[];
};

export function ApiMarketplaceTable({ entries }: ApiMarketplaceTableProps) {
  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/90 text-xs uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="px-4 py-3">API</th>
            <th className="px-4 py-3">Publisher</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-200/80 align-top hover:bg-slate-50">
              <td className="px-4 py-4">
                <p className="font-semibold text-slate-950">{entry.name}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.shortDescription}</p>
              </td>
              <td className="px-4 py-4 text-slate-700">
                <p className="font-semibold text-slate-900">{entry.publisher}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {entry.platformName}
                </p>
              </td>
              <td className="px-4 py-4 text-slate-700">{entry.category}</td>
              <td className="px-4 py-4 text-slate-700">{entry.apiType}</td>
              <td className="px-4 py-4 text-slate-700">{entry.lifecycleStatus}</td>
              <td className="px-4 py-4 text-slate-700">{entry.lastUpdated}</td>
              <td className="px-4 py-4">
                <Link
                  href={`/admin/platform/connectivity/catalog/${entry.slug}`}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  View API
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
