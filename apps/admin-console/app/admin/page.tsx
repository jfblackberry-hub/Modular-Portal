'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AdminLoadingState } from '../../components/admin-ui';
import { useAdminSession } from '../../components/admin-session-provider';
import { getDefaultAdminHref } from '../../components/admin-route-config';

export default function AdminIndexPage() {
  const router = useRouter();
  const { session, isLoading } = useAdminSession();

  useEffect(() => {
    if (isLoading || !session) {
      return;
    }

    router.replace(getDefaultAdminHref(session.isPlatformAdmin, session.tenantId));
  }, [isLoading, router, session]);

  return (
    <div className="p-6">
      <AdminLoadingState
        title="Opening control plane"
        description="Resolving the correct admin scope for the current session."
      />
    </div>
  );
}
