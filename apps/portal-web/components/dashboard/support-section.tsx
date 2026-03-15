import Link from 'next/link';
import { FileUp, Headset, LifeBuoy } from 'lucide-react';
import { ImageBlock } from '../ui/image-block';

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
      <ImageBlock
        src="/assets/portal-images/family-healthcare.svg"
        alt="Family receiving healthcare support"
        className="mt-4 aspect-[21/8]"
      />

      <ul className="mt-6 flex flex-wrap gap-3">
        {supportItems.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--tenant-primary-soft-color)] px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition duration-150 hover:-translate-y-0.5 hover:brightness-95 active:scale-[0.98]"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[var(--tenant-primary-color)]">
                  <Icon size={15} />
                </span>
                <span>{item.label}</span>
              </Link>
              <p className="mt-2 max-w-[260px] text-sm text-[var(--text-muted)]">{item.description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
