type ApiCatalogHeaderProps = {
  totalCount: number;
  implementedCount: number;
  blockerCount: number;
  tenantReadyCount: number;
  search: string;
  onSearchChange: (value: string) => void;
};

export function ApiCatalogHeader({
  totalCount,
  implementedCount,
  blockerCount,
  tenantReadyCount,
  search,
  onSearchChange
}: ApiCatalogHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.10),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_20%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_50%,_#f2f7fb_100%)] px-7 py-6 shadow-[0_26px_64px_rgba(15,23,42,0.08)]">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.9fr)] xl:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
            Platform Connectivity
          </p>
          <h1 className="mt-3 text-[2.85rem] font-semibold tracking-[-0.05em] text-slate-950">
            API Catalog
          </h1>
          <p className="mt-3 max-w-3xl text-[1rem] leading-7 text-slate-600">
            Browse supported healthcare integrations and platform APIs across clinical,
            claims, pharmacy, interoperability, and admin domains.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { label: 'Available APIs', value: String(totalCount) },
              { label: 'Implemented', value: String(implementedCount) },
              { label: 'Ready for AWS Planning', value: String(blockerCount + tenantReadyCount) }
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-[10.5rem] rounded-[1.2rem] border border-white/80 bg-white/85 px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1.5 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white/92 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Search the catalog
              </p>
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search vendors, APIs, standards, capabilities, or tags"
                className="mt-1 w-full bg-transparent p-0 text-[0.98rem] text-slate-950 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 px-1">
            <p className="text-sm leading-6 text-slate-600">
              Search first, then narrow only if you need to.
            </p>
            <div className="hidden rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 sm:block">
              Discovery first
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
