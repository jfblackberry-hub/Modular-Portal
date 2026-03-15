'use client';

import type { ReactNode } from 'react';

import { useAdminSession } from './admin-session-provider';
import { AccessDeniedCard } from './access-denied-card';
import { SectionCard } from './section-card';

export function PlatformAdminGate({ children }: { children: ReactNode }) {
  const { session, isLoading, error } = useAdminSession();

  if (isLoading) {
    return (
      <SectionCard
        title="Loading platform admin"
        description="Checking your administrative access."
      >
        <p className="text-sm text-admin-muted">Loading...</p>
      </SectionCard>
    );
  }

  if (error && !session) {
    return (
      <SectionCard
        title="Unable to verify access"
        description="The console could not confirm the active admin session."
      >
        <p className="text-sm text-admin-muted">{error}</p>
      </SectionCard>
    );
  }

  if (!session?.isPlatformAdmin) {
    return <AccessDeniedCard />;
  }

  return <>{children}</>;
}
