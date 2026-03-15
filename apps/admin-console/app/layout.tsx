import './globals.css';

import type { Metadata } from 'next';

import { AdminSessionProvider } from '../components/admin-session-provider';
import { AdminShell } from '../components/admin-shell';

export const metadata: Metadata = {
  title: 'Admin Console',
  description: 'Administrative console for the modular healthcare payer portal.'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AdminSessionProvider>
          <AdminShell>{children}</AdminShell>
        </AdminSessionProvider>
      </body>
    </html>
  );
}
