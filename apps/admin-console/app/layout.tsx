import './globals.css';
import '../lib/server-runtime';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminSessionProvider } from '../components/admin-session-provider';
import { AdminShell } from '../components/admin-shell';
import { config } from '../lib/public-runtime';

export const metadata: Metadata = {
  title: 'averra control plane',
  description: 'Administrative control plane for the averra platform.'
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href={`${config.serviceEndpoints.api}/public/platform-branding/custom.css`}
        />
      </head>
      <body>
        <AdminSessionProvider>
          <AdminShell>{children}</AdminShell>
        </AdminSessionProvider>
      </body>
    </html>
  );
}
