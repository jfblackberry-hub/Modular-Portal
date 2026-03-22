import Link from 'next/link';

export function LegacyTenantAdminReadOnly({
  title,
  description,
  targetHref
}: {
  title: string;
  description: string;
  targetHref: string;
}) {
  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Read Only</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
          {description}
        </p>
      </section>

      <section className="portal-card p-5">
        <p className="text-sm leading-7 text-[var(--text-secondary)]">
          Tenant administrative workflows now live in the dedicated tenant-admin workspace.
        </p>
        <Link
          href={targetHref}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
        >
          Open Tenant Admin Workspace
        </Link>
      </section>
    </div>
  );
}
