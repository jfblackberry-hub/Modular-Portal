type ApiMarketplaceHeaderProps = {
  totalCount: number;
  categoryCount: number;
  tenantScopedCount: number;
  modelCount: number;
  search: string;
  onSearchChange: (value: string) => void;
};

export function ApiMarketplaceHeader({
  totalCount,
  categoryCount,
  tenantScopedCount,
  modelCount,
  search,
  onSearchChange
}: ApiMarketplaceHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(145deg,#081322_0%,#102b45_45%,#0f766e_100%)] px-7 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
            API Marketplace
          </p>
          <h1 className="mt-3 text-[2.7rem] font-semibold tracking-[-0.05em] text-white">
            Browse integration APIs
          </h1>
          <p className="mt-3 max-w-3xl text-[1rem] leading-7 text-slate-300">
            Explore claims, pharmacy, clinical, eligibility, and authorization APIs with marketplace-style discovery, vendor metadata, and schema model visibility.
          </p>
        </div>

        <div className="rounded-[1.65rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
          <label className="block">
            <span className="sr-only">Search catalog</span>
            <div className="flex items-center gap-3 rounded-[1.3rem] border border-white/12 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.14)]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900">
                API
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Search catalog
                </p>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search by API, vendor, endpoint, or model"
                  className="mt-1 w-full bg-transparent p-0 text-[1rem] text-slate-950 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Catalog entries', value: totalCount },
          { label: 'Visible categories', value: categoryCount },
          { label: 'Schema models', value: modelCount },
          { label: 'Tenant-scoped APIs', value: tenantScopedCount }
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[1.35rem] border border-white/10 bg-white/7 px-4 py-4 backdrop-blur"
          >
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-300">
              {stat.label}
            </p>
            <p className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
