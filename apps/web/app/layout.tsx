import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
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

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const themeInitScript = `
(function(){
  try {
    var s = localStorage.getItem('laquartz.appearance.v2');
    var p = s ? (JSON.parse(s).state || {}) : {};
    var root = document.documentElement;
    root.setAttribute('data-mode', p.mode || 'obsidian');
    root.setAttribute('data-theme', p.theme || 'aurora');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={spaceGrotesk.variable}
      data-mode="obsidian"
      data-theme="aurora"
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
