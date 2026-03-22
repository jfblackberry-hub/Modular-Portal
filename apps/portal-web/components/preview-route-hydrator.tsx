'use client';

import { useEffect } from 'react';

import { prefixPreviewHref } from '../lib/preview-route';

export function PreviewRouteHydrator({
  routePrefix
}: {
  routePrefix: string;
}) {
  useEffect(() => {
    function rewriteLinks(root: ParentNode) {
      const anchors = root.querySelectorAll?.('a[href]') ?? [];
      anchors.forEach((anchor) => {
        if (!(anchor instanceof HTMLAnchorElement)) {
          return;
        }

        const href = anchor.getAttribute('href');

        if (!href) {
          return;
        }

        const nextHref = prefixPreviewHref(routePrefix, href);

        if (nextHref !== href) {
          anchor.setAttribute('href', nextHref);
        }
      });

      const forms = root.querySelectorAll?.('form[action]') ?? [];
      forms.forEach((form) => {
        if (!(form instanceof HTMLFormElement)) {
          return;
        }

        const action = form.getAttribute('action');

        if (!action) {
          return;
        }

        const nextAction = prefixPreviewHref(routePrefix, action);

        if (nextAction !== action) {
          form.setAttribute('action', nextAction);
        }
      });
    }

    rewriteLinks(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            rewriteLinks(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [routePrefix]);

  return null;
}
