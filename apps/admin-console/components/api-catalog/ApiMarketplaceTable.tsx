import Link from 'next/link';

import {
  type ApiCatalogCategory,
  type ApiCatalogEntry,
  formatApiCatalogCategory,
  formatTenantAvailability} from '../../lib/api-catalog-api';
import { AdminEmptyState } from '../admin-ui';

type ApiMarketplaceTableProps = {
  groups: Array<{
    category: ApiCatalogCategory;
    label: string;
    entries: ApiCatalogEntry[];
  }>;
};

export function ApiMarketplaceTable({ groups }: ApiMarketplaceTableProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10">
        <AdminEmptyState
          title="No APIs match the current browse settings"
          description="Try a broader search, another vendor, or a different category filter."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section
          key={group.category}
          className="overflow-x-auto rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">{group.label}</h2>
            <p className="text-xs text-slate-600">
              {group.entries.length} API{group.entries.length === 1 ? '' : 's'}
            </p>
          </div>

          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">API</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Models</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {group.entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-slate-200/80 align-top hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950">{entry.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{entry.description}</p>
                    <p className="mt-2 text-xs font-medium text-slate-500">{entry.version}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{entry.vendor}</td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatApiCatalogCategory(entry.category)}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-700">{entry.endpoint}</td>
                  <td className="px-4 py-4 text-slate-700">
                    <p>{entry.inputModels.length} input</p>
                    <p>{entry.outputModels.length} output</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatTenantAvailability(entry.tenantAvailability)}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/shared/api-catalog/${entry.slug}`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      View API
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
