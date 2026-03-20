'use client';

import { useState } from 'react';

export function PortalSearchForm({
  searchBasePath
}: {
  searchBasePath: string;
}) {
  const [query, setQuery] = useState('');

  return (
    <form
      action={searchBasePath}
      className="tenant-search-form flex min-h-11 items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2 shadow-sm"
      role="search"
      aria-label="Search your portal"
    >
      <div className="tenant-search-form__field flex min-w-0 flex-1 flex-col">
        <label
          htmlFor="platform-search"
          className="tenant-search-form__label text-[12px] font-medium text-[var(--text-muted)]"
        >
          Search portal
        </label>
        <input
          id="platform-search"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Claims, documents, providers"
          className="tenant-search-form__input mt-1 w-full border-0 bg-transparent p-0 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>
      <button
        type="submit"
        className="tenant-search-form__button inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        style={{ backgroundColor: 'var(--tenant-primary-color)' }}
      >
        Search
      </button>
    </form>
  );
}
