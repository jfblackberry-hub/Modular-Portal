export function TenantAdminLoadingCard() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="h-3 w-40 rounded-full bg-slate-200" />
      <div className="mt-4 h-10 w-72 rounded-full bg-slate-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="h-3 w-24 rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-20 rounded-full bg-slate-200" />
            <div className="mt-4 h-3 w-full rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
