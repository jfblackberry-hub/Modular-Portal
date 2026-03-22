import './globals.css';

import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';

import { AdminSessionProvider } from '../components/admin-session-provider';
import { AdminShell } from '../components/admin-shell';
import { colors, semanticColors, surfaceColors } from '../lib/colors';

export const metadata: Metadata = {
  title: 'Admin Console',
  description: 'Administrative console for the modular healthcare payer portal.'
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={
          {
            '--admin-shell-bg': colors.background,
            '--admin-sidebar-bg': colors.sidebar,
            '--admin-section-bg': colors.section,
            '--admin-hover': colors.hover,
            '--admin-active': colors.active,
            '--admin-active-accent': colors.activeAccent,
            '--admin-sidebar-border': colors.border,
            '--admin-sidebar-text': colors.textPrimary,
            '--admin-sidebar-text-muted': colors.textMuted,
            '--admin-sidebar-text-section': colors.textSection,
            '--admin-content-bg': surfaceColors.contentBackground,
            '--admin-surface': surfaceColors.surface,
            '--admin-success': semanticColors.success,
            '--admin-warning': semanticColors.warning,
            '--admin-danger': semanticColors.danger
          } as CSSProperties
        }
      >
        <AdminSessionProvider>
          <AdminShell>{children}</AdminShell>
        </AdminSessionProvider>
      </body>
    </html>
  );
}
