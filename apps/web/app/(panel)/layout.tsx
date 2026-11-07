'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBar } from '@/components/layout/StatusBar';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  // Auto-close the mobile drawer when the viewport reaches desktop width.
  // Prevents a hidden-but-focus-trapped modal if the user rotates
  // the device or resizes the window while the drawer is open.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar open={navOpen} onOpenChange={setNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[var(--content-max-width)]">{children}</div>
        </main>
        <StatusBar />
      </div>
    </div>
  );
        }
