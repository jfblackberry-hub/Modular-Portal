type ApiMarketplaceHeaderProps = {
  totalCount: number;
  featuredCount: number;
  availableCount: number;
  sandboxCount: number;
  search: string;
  onSearchChange: (value: string) => void;
};

export function ApiMarketplaceHeader({
  totalCount,
  featuredCount,
  availableCount,
  sandboxCount,
  search,
  onSearchChange
}: ApiMarketplaceHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#10233a_38%,#16314e_100%)] px-7 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(24rem,0.95fr)] xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/90">
            Healthcare Integration Marketplace
          </p>
          <h1 className="mt-3 text-[2.4rem] font-semibold tracking-[-0.05em] text-white">
            API Marketplace
          </h1>
          <p className="mt-3 max-w-3xl text-[0.98rem] leading-7 text-slate-300">
            Browse healthcare APIs, integration assets, and partner connectivity products across claims, eligibility, prior authorization, pharmacy, clinical, and platform operations.
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
          <label className="block">
            <span className="sr-only">Search APIs</span>
            <div className="flex items-center gap-3 rounded-[1.3rem] border border-white/12 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.14)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-900">
                API
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Search marketplace
                </p>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search APIs, partners, claims, eligibility, pharmacy, prior auth..."
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
          { label: 'Featured integrations', value: featuredCount },
          { label: 'Available now', value: availableCount },
          { label: 'Sandbox-ready', value: sandboxCount }
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
