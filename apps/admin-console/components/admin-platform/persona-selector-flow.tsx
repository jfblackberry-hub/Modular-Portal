'use client';

import { useState } from 'react';

import {
  PERSONA_TYPE_OPTIONS,
  type PersonaSessionDraft
} from '../../lib/admin-platform-sessions';

export function PersonaSelectorFlow({
  onCreateSession
}: {
  onCreateSession: (draft: PersonaSessionDraft) => void;
}) {
  const [tenantId, setTenantId] = useState('');
  const [personaType, setPersonaType] =
    useState<PersonaSessionDraft['personaType']>('tenant_admin');
  const [userId, setUserId] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenantId.trim() || !userId.trim()) {
      return;
    }

    onCreateSession({
      tenantId,
      personaType,
      userId
    });
    setUserId('');
  }

  return (
    <section className="rounded-[28px] border border-[#223451] bg-[#0b1628] p-6 text-white shadow-[0_24px_70px_rgba(7,12,20,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
        Persona Selector
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
        Launch an isolated admin session
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Each persona session stays contained in its own window with an explicit
        tenant and user identity.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Tenant ID
          </span>
          <input
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            placeholder="tenant-123"
            className="mt-2 w-full rounded-2xl border border-[#2a4368] bg-[#11213a] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Persona
          </span>
          <select
            value={personaType}
            onChange={(event) =>
              setPersonaType(event.target.value as PersonaSessionDraft['personaType'])
            }
            className="mt-2 w-full rounded-2xl border border-[#2a4368] bg-[#11213a] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          >
            {PERSONA_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-400">
            {
              PERSONA_TYPE_OPTIONS.find((option) => option.value === personaType)
                ?.description
            }
          </p>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            User ID
          </span>
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="user-456"
            className="mt-2 w-full rounded-2xl border border-[#2a4368] bg-[#11213a] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          />
        </label>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Open Session Window
        </button>
      </form>
    </section>
  );
}
