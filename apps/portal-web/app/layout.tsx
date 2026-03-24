import './globals.css';
import '../lib/server-runtime';
import '../lib/runtime-config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blue Horizon Health',
  description:
    'Primary frontend portal for the modular healthcare payer platform.'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
