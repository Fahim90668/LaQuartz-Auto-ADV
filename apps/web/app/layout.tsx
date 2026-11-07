import type { Metadata } from 'next';
import { Providers } from '@/components/layout/Providers';
import { ThemeSync } from '@/components/appearance/ThemeSync';
import { AppearanceDialog } from '@/components/appearance/AppearanceDialog';
import '@/styles/globals.css';
import '@/styles/appearance.css';

export const metadata: Metadata = {
  title: 'LaQuartz AUTO-ADV',
  description: 'License-gated Discord advertising automation.',
  robots: { index: false, follow: false },
};

const themeInitScript = `
(function(){
  try {
    var s = localStorage.getItem('laquartz.appearance.v1');
    var p = s ? (JSON.parse(s).state || {}) : {};
    var root = document.documentElement;
    root.setAttribute('data-mode', p.mode || 'obsidian');
    root.setAttribute('data-theme', p.theme || 'aurora');
    root.setAttribute('data-accent', p.accent || 'brand');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="obsidian"
      data-theme="aurora"
      data-accent="brand"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>
          <ThemeSync />
          {children}
          <AppearanceDialog />
        </Providers>
      </body>
    </html>
  );
          }
