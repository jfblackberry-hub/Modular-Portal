'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

type PreviewEventType =
  | 'route_changed'
  | 'route_blocked'
  | 'workflow_action_invoked'
  | 'write_attempted'
  | 'write_completed'
  | 'entitlement_mismatch'
  | 'failed_navigation_attempt';

async function postPreviewEvent(body: {
  type: PreviewEventType;
  route: string;
  fromRoute?: string;
  detail?: string;
  statusCode?: number;
}) {
  try {
    await fetch('/api/admin-preview/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
  } catch {
    // Best-effort telemetry only.
  }
}

export function PreviewSessionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousRouteRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const search = searchParams.toString();
    const nextRoute = search ? `${pathname}?${search}` : pathname;
    const previousRoute = previousRouteRef.current;

    void postPreviewEvent({
      type: 'route_changed',
      route: nextRoute,
      fromRoute: previousRoute
    });

    previousRouteRef.current = nextRoute;
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const actionable = target.closest('button,[role="button"],a[href]');

      if (!(actionable instanceof HTMLElement)) {
        return;
      }

      const detail =
        actionable instanceof HTMLAnchorElement
          ? actionable.getAttribute('href') ?? actionable.textContent?.trim() ?? 'link'
          : actionable.getAttribute('aria-label') ??
            actionable.textContent?.trim() ??
            actionable.tagName.toLowerCase();

      void postPreviewEvent({
        type: 'workflow_action_invoked',
        route: previousRouteRef.current ?? pathname,
        detail
      });
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target;

      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      const action = form.getAttribute('action') ?? previousRouteRef.current ?? pathname;

      void postPreviewEvent({
        type: 'workflow_action_invoked',
        route: previousRouteRef.current ?? pathname,
        detail: `form:${action}`
      });
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, [pathname]);

  return null;
}

export function reportBlockedPreviewRoute(input: {
  route: string;
  detail: string;
  type?: Extract<
    PreviewEventType,
    'route_blocked' | 'entitlement_mismatch' | 'failed_navigation_attempt'
  >;
}) {
  void postPreviewEvent({
    type: input.type ?? 'route_blocked',
    route: input.route,
    detail: input.detail
  });
}
