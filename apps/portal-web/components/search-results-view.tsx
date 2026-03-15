import Link from 'next/link';

import {
  buildDocumentResultHref,
  buildTenantResultHref,
  buildUserResultHref,
  type PlatformSearchResponse
} from '../lib/platform-search';

function formatTimestamp(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium'
  }).format(date);
}

function SearchGroup({
  children,
  description,
  title
}: Readonly<{
  children: React.ReactNode;
  description: string;
  title: string;
}>) {
  return (
    <section className="portal-card p-6">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="portal-card border-dashed p-8 text-center">
      <h2 className="text-2xl font-semibold text-[var(--text-primary)]">No matches found</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        No documents, users, or tenants matched <span className="font-semibold text-[var(--text-primary)]">{query}</span>.
      </p>
    </div>
  );
}

export function SearchResultsView({
  result,
  searchBasePath
}: {
  result: PlatformSearchResponse | null;
  searchBasePath: string;
}) {
  const query = result?.query ?? '';
  const documents = result?.results.documents ?? [];
  const users = result?.results.users ?? [];
  const tenants = result?.results.tenants ?? [];
  const totalResults = documents.length + users.length + tenants.length;

  return (
    <div className="space-y-6">
      <section className="portal-card p-8">
        <p className="text-sm font-medium text-[var(--tenant-primary-color)]">
          Platform Search
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
          Search results
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
          {query
            ? `${totalResults} result${totalResults === 1 ? '' : 's'} for "${query}".`
            : 'Search documents, users, and your tenant workspace from one place.'}
        </p>
      </section>

      {!query ? (
        <div className="portal-card border-dashed p-8 text-center text-sm leading-6 text-[var(--text-secondary)]">
          Enter a term in the header search bar to look across tenant-scoped documents,
          users, and tenant records.
        </div>
      ) : totalResults === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div className="space-y-6">
          <SearchGroup
            title="Documents"
            description="Tenant-owned documents that match the current query."
          >
            {documents.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No matching documents.</p>
            ) : (
              documents.map((document) => (
                <Link
                  key={document.id}
                  href={buildDocumentResultHref(searchBasePath, document.id)}
                  className="block rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-5 transition hover:border-[var(--tenant-primary-color)] hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        {document.filename}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {document.mimeType} · {document.status}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTimestamp(document.createdAt)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </SearchGroup>

          <SearchGroup
            title="Users"
            description="Users in your tenant workspace that match the current query."
          >
            {users.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No matching users.</p>
            ) : (
              users.map((user) => (
                <a
                  key={user.id}
                  href={buildUserResultHref(user.id)}
                  className="block rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-5 transition hover:border-[var(--tenant-primary-color)] hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {user.email} · {user.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTimestamp(user.createdAt)}
                    </span>
                  </div>
                </a>
              ))
            )}
          </SearchGroup>

          <SearchGroup
            title="Tenants"
            description="Your current tenant record when it matches the query."
          >
            {tenants.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No matching tenant records.</p>
            ) : (
              tenants.map((tenant) => (
                <a
                  key={tenant.id}
                  href={buildTenantResultHref(tenant.id)}
                  className="block rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-5 transition hover:border-[var(--tenant-primary-color)] hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">{tenant.name}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {tenant.slug} · {tenant.status}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTimestamp(tenant.createdAt)}
                    </span>
                  </div>
                </a>
              ))
            )}
          </SearchGroup>
        </div>
      )}
    </div>
  );
}
