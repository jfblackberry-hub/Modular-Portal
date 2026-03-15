import Link from 'next/link';

const featureCards = [
  {
    title: 'Benefits and coverage',
    description: 'Explain plan details, deductible progress, and care access in clear member language.'
  },
  {
    title: 'Claims and documents',
    description: 'Surface the most important status information above the fold with simple cards and guided detail.'
  },
  {
    title: 'Support and navigation',
    description: 'Help members find providers, send messages, pay bills, and contact support without friction.'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-[var(--tenant-primary-color)]">
            Modular payer portal
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
            A modern healthcare member portal experience for local development.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            The default shell now follows familiar payer patterns: light
            surfaces, trusted blue accents, quick member tasks, and clear
            support paths.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="portal-card p-6"
            >
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
