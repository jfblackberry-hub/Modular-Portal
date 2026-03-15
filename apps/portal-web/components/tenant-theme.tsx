'use client';

import { useEffect } from 'react';

import type { TenantBranding } from '../lib/tenant-branding';

export function TenantTheme({ branding }: { branding: TenantBranding }) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', branding.primaryColor);
    root.style.setProperty('--tenant-secondary', branding.secondaryColor);
    root.style.setProperty('--tenant-primary-color', branding.primaryColor);
    root.style.setProperty('--tenant-primary-soft-color', branding.primarySoftColor);
    root.style.setProperty('--tenant-secondary-color', branding.secondaryColor);
    root.style.setProperty('--tenant-secondary-soft-color', branding.secondarySoftColor);
    root.style.setProperty('--tenant-font', branding.fontFamily);
    document.body.style.fontFamily = 'var(--tenant-font)';

    const head = document.head;
    let favicon = head.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      head.appendChild(favicon);
    }

    favicon.href = branding.faviconUrl ?? '/favicon.ico';
  }, [
    branding.faviconUrl,
    branding.fontFamily,
    branding.primaryColor,
    branding.primarySoftColor,
    branding.secondaryColor,
    branding.secondarySoftColor
  ]);

  return null;
}
