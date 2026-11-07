import type { Metadata } from 'next';
import { Providers } from '@/components/layout/Providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'LaQuartz AUTO-ADV',
  description: 'License-gated Discord advertising automation.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
