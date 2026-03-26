'use client';

import { useEffect } from 'react';

import type { TenantBranding } from '../lib/tenant-branding';

export function TenantTheme({ branding }: { branding: TenantBranding }) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootTheme = root.getAttribute('data-tenant-theme');
    const previousBodyTheme = body.getAttribute('data-tenant-theme');
    root.style.setProperty('--tenant-primary', branding.primaryColor);
    root.style.setProperty('--tenant-secondary', branding.secondaryColor);
    root.style.setProperty('--tenant-primary-color', branding.primaryColor);
    root.style.setProperty('--tenant-primary-soft-color', branding.primarySoftColor);
    root.style.setProperty('--tenant-secondary-color', branding.secondaryColor);
    root.style.setProperty('--tenant-secondary-soft-color', branding.secondarySoftColor);
    root.style.setProperty('--tenant-font', branding.fontFamily);
    body.style.fontFamily = 'var(--tenant-font)';

    if (branding.themeKey) {
      root.setAttribute('data-tenant-theme', branding.themeKey);
      body.setAttribute('data-tenant-theme', branding.themeKey);
    } else {
      root.removeAttribute('data-tenant-theme');
      body.removeAttribute('data-tenant-theme');
    }

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

    return () => {
      if (previousRootTheme) {
        root.setAttribute('data-tenant-theme', previousRootTheme);
      } else {
        root.removeAttribute('data-tenant-theme');
      }

      if (previousBodyTheme) {
        body.setAttribute('data-tenant-theme', previousBodyTheme);
      } else {
        body.removeAttribute('data-tenant-theme');
      }
    };
  }, [
    branding.customCss,
    branding.faviconUrl,
    branding.fontFamily,
    branding.primaryColor,
    branding.primarySoftColor,
    branding.secondaryColor,
    branding.secondarySoftColor,
    branding.themeKey
  ]);

  return null;
}
