import Link from 'next/link';
import type { ReactNode } from 'react';

type PreviewNavItem = {
  href: string;
  label: string;
  description: string;
};

export function PreviewSessionShell({
  title,
  description,
  items,
  children
}: {
  title: string;
  description: string;
  items: readonly PreviewNavItem[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 pb-8 pt-6 lg:px-6">
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-[92px] rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>

            <nav aria-label={`${title} preview navigation`} className="mt-4 space-y-2">
              {items.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block rounded-2xl border px-4 py-3 transition ${
                    index === 0
                      ? 'border-[var(--tenant-primary-color,#0f6cbd)] bg-[color:color-mix(in_srgb,var(--tenant-primary-color,#0f6cbd)_10%,white)]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
