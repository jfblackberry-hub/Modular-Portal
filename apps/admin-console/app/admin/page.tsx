'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAdminSession } from '../../components/admin-session-provider';
import { getDefaultAdminHref } from '../../components/admin-route-config';

export default function AdminIndexPage() {
  const router = useRouter();
  const { session, isLoading } = useAdminSession();

  useEffect(() => {
    if (!isLoading && session) {
      router.replace(getDefaultAdminHref(session.isPlatformAdmin));
    }
  }, [isLoading, router, session]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-admin-muted">Loading admin workspace...</p>
    </div>
  );
}
