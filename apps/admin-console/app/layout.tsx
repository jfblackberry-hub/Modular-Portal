import './globals.css';
import '../lib/server-runtime';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminSessionProvider } from '../components/admin-session-provider';
import { AdminShell } from '../components/admin-shell';

export const metadata: Metadata = {
  title: 'averra control center',
  description: 'Administrative control center for the averra platform.'
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="averra-admin">
        <AdminSessionProvider>
          <AdminShell>{children}</AdminShell>
        </AdminSessionProvider>
      </body>
    </html>
  );
}
