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

    const styleId = 'tenant-custom-css';
    let customStyle = head.querySelector<HTMLStyleElement>(`style[data-tenant-style="${styleId}"]`);

    if (!customStyle) {
      customStyle = document.createElement('style');
      customStyle.setAttribute('data-tenant-style', styleId);
      head.appendChild(customStyle);
    }

    customStyle.textContent = branding.customCss ?? '';
  }, [
    branding.customCss,
    branding.faviconUrl,
    branding.fontFamily,
    branding.primaryColor,
    branding.primarySoftColor,
    branding.secondaryColor,
    branding.secondarySoftColor
  ]);

  return null;
}
