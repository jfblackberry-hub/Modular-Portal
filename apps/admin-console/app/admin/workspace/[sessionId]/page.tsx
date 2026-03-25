import Link from 'next/link';
import React from 'react';

export default async function AdminPersonaWorkspacePage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
          Control plane only
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
          Embedded admin workspaces are retired
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
          Session <code>{sessionId}</code> can still be governed from the session controls page, but the admin console no longer embeds portal experiences.
        </p>
      </div>

      <Link
        href="/admin/platform/security/sessions"
        className="inline-flex rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
      >
        Open session controls
      </Link>
    </div>
  );
}
