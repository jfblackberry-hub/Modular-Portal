'use client';

import Link from 'next/link';
import React from 'react';

import {
  getPersonaLabel,
  isPersonaType,
  type PersonaType
} from '../../lib/admin-platform-sessions';

function resolveWorkspaceSummary(personaType: PersonaType) {
  switch (personaType) {
    case 'platform_operator':
      return {
        title: 'Platform operations workspace',
        bullets: [
          'Platform-wide health and readiness checks',
          'Cross-tenant operational visibility',
          'Guarded controls for platform-only actions'
        ]
      };
    case 'tenant_admin':
      return {
        title: 'Tenant administration workspace',
        bullets: [
          'Tenant-scoped settings and configuration',
          'User, role, and integration administration',
          'No automatic access to other tenant sessions'
        ]
      };
    case 'support_analyst':
      return {
        title: 'Support investigation workspace',
        bullets: [
          'Read-focused troubleshooting posture',
          'Clear tenant and persona boundaries',
          'Optimized for incident review and triage'
        ]
      };
    case 'auditor':
      return {
        title: 'Audit and evidence workspace',
        bullets: [
          'Traceability-first review surface',
          'Explicit tenant and actor context',
          'Separated from operational admin windows'
        ]
      };
  }
}

export function AdminPersonaWorkspace({
  sessionId,
  tenantId,
  personaType,
  userId
}: {
  sessionId: string;
  tenantId: string;
  personaType: string;
  userId: string;
}) {
  if (!tenantId.trim() || !userId.trim() || !isPersonaType(personaType)) {
    return (
      <div className="min-h-screen bg-[#07101a] px-5 py-5 text-white">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-900/50 bg-[#0d1826] p-8 shadow-[0_20px_60px_rgba(5,10,18,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
            Session Unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
            This persona workspace is unavailable.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The workspace could not resolve a valid tenant, persona, and user identity.
          </p>
        </div>
      </div>
    );
  }

  const resolvedPersonaType = personaType;
  const summary = resolveWorkspaceSummary(resolvedPersonaType);
  const normalizedTenantId = tenantId.trim();
  const normalizedUserId = userId.trim();

  return (
    <div className="min-h-screen bg-[#07101a] px-5 py-5 text-white">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[28px] border border-[#20324a] bg-[#0d1826] p-6 shadow-[0_20px_60px_rgba(5,10,18,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Contained Session Window
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
            {summary.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Persona {getPersonaLabel(resolvedPersonaType)} is isolated to this
            window with explicit session context.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] border border-[#20324a] bg-[#0d1826] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Tenant
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {normalizedTenantId}
            </p>
          </article>
          <article className="rounded-[24px] border border-[#20324a] bg-[#0d1826] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Persona
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {getPersonaLabel(resolvedPersonaType)}
            </p>
          </article>
          <article className="rounded-[24px] border border-[#20324a] bg-[#0d1826] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              User
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {normalizedUserId}
            </p>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="rounded-[28px] border border-[#20324a] bg-[#0d1826] p-6">
            <p className="text-sm font-semibold text-white">Session model</p>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#06101d] p-4 text-sm text-cyan-100">
{`session = {
  tenantId: "${normalizedTenantId}",
  personaType: "${resolvedPersonaType}",
  userId: "${normalizedUserId}"
}`}
            </pre>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
              {summary.bullets.map((bullet) => (
                <li key={bullet} className="rounded-2xl bg-[#101b2a] px-4 py-3">
                  {bullet}
                </li>
              ))}
            </ul>
          </article>

          <aside className="rounded-[28px] border border-[#20324a] bg-[#0d1826] p-6">
            <p className="text-sm font-semibold text-white">Session security</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Admin authentication stays separate from tenant persona state.</li>
              <li>No shared persona context is injected across windows.</li>
              <li>Each contained window resolves only its own explicit session.</li>
            </ul>

            <div className="mt-5 rounded-2xl border border-[#27405d] bg-[#0a1422] p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Workspace routes</p>
              <div className="mt-3 space-y-2">
                <Link
                  href="/admin/platform/health"
                  className="block text-cyan-300 underline-offset-4 hover:underline"
                >
                  /admin/platform/health
                </Link>
                <Link
                  href="/admin/tenant/health"
                  className="block text-cyan-300 underline-offset-4 hover:underline"
                >
                  /admin/tenant/health
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <p className="text-xs text-slate-500">
          Session route: <code>/admin/workspace/{sessionId}</code>
        </p>
      </div>
    </div>
  );
}
