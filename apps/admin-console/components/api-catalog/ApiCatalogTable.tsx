import type { ApiCatalogEntry } from '../../lib/api-catalog.types';
import {
  getAwsTone,
  getCategoryTone,
  getImplementationTone,
  getPriorityTone
} from '../../lib/api-catalog.utils';

type ApiCatalogTableProps = {
  entries: ApiCatalogEntry[];
  selectedEntryId: string | null;
  onSelect: (entry: ApiCatalogEntry) => void;
};

export function ApiCatalogTable({
  entries,
  selectedEntryId,
  onSelect
}: ApiCatalogTableProps) {
  return (
    <div className="overflow-x-auto rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)] text-xs tracking-[0.08em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">API</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Implementation</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">AWS</th>
            <th className="px-4 py-3">Tenant Configurable</th>
            <th className="px-4 py-3">Last Reviewed</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const selected = selectedEntryId === entry.id;
            return (
              <tr
                key={entry.id}
                onClick={() => onSelect(entry)}
                className={`cursor-pointer border-b border-slate-200/80 align-top transition hover:bg-slate-50 ${
                  selected ? 'bg-cyan-50/70' : 'bg-white'
                }`}
              >
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-950">{entry.vendorName}</p>
                  <p className="mt-1 text-xs tracking-[0.08em] text-slate-500">
                    {entry.platformName}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-950">{entry.apiName}</p>
                  <p className="mt-1 text-sm text-slate-600">{entry.summary}</p>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryTone(
                      entry.apiCategory
                    )}`}
                  >
                    {entry.apiCategory}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getImplementationTone(
                      entry.implementationStatus
                    )}`}
                  >
                    {entry.implementationStatus}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityTone(
                      entry.strategicPriority
                    )}`}
                  >
                    {entry.strategicPriority}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getAwsTone(
                      entry.awsRelevance
                    )}`}
                  >
                    {entry.awsRelevance}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {entry.tenantConfigurable ? 'Yes' : 'No'}
                </td>
                <td className="px-4 py-4 text-slate-600">{entry.lastReviewed}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
