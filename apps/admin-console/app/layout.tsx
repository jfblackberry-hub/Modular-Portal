import './globals.css';
import '../lib/server-runtime';

import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';

import { AdminSessionProvider } from '../components/admin-session-provider';
import { AdminShell } from '../components/admin-shell';
import { colors, semanticColors, surfaceColors } from '../lib/colors';

export const metadata: Metadata = {
  title: 'Averra Control Center',
  description: 'Administrative control center for the Averra platform.'
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body
        className="averra-admin"
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
