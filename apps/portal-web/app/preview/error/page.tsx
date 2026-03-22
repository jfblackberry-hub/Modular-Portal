export default async function PreviewErrorPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-50">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
          Admin Preview
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
          Preview session unavailable
        </h1>
        <p className="mt-4 text-base text-slate-300">
          {reason
            ? `The preview session could not be started: ${reason}.`
            : 'The preview session could not be started.'}
        </p>
      </div>
    </main>
  );
}
