'use client';

import { useEffect } from 'react';

import { reportBlockedPreviewRoute } from './preview-session-tracker';

export function PreviewRouteUnavailable({
  title,
  description,
  route,
  type = 'route_blocked'
}: {
  title: string;
  description: string;
  route: string;
  type?: 'route_blocked' | 'entitlement_mismatch' | 'failed_navigation_attempt';
}) {
  useEffect(() => {
    reportBlockedPreviewRoute({
      route,
      detail: description,
      type
    });
  }, [description, route, type]);

  return (
    <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-8 py-10 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
        Session state
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
        {description}
      </p>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-600">
        Requested route: <span className="font-semibold text-slate-900">{route}</span>
      </div>
    </div>
  );
}
