import { FileUp, Headset, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

const supportItems = [
  {
    href: '/dashboard/help',
    icon: Headset,
    label: 'Contact support',
    description: 'Talk with member services about benefits, billing, and claims.'
  },
  {
    href: '/dashboard/documents',
    icon: FileUp,
    label: 'Upload documents',
    description: 'Send requested forms, receipts, and supporting files.'
  },
  {
    href: '/dashboard/help',
    icon: LifeBuoy,
    label: 'Help center',
    description: 'Find FAQs, accessibility resources, and language assistance.'
  }
];

export function SupportSection() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm" aria-label="Support">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Support</h2>

      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {supportItems.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.label} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50/70 p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[var(--tenant-primary-color)]">
                  <Icon size={16} />
                </span>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p>
              <Link
                href={item.href}
                className="mt-3 inline-flex text-sm font-semibold text-[var(--tenant-primary-color)] hover:underline"
              >
                Open
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
