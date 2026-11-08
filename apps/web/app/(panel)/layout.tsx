'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBar } from '@/components/layout/StatusBar';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setNavOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      <Sidebar open={navOpen} onOpenChange={setNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setNavOpen(true)} />
        {/* LEFT-anchored — no mx-auto. Content caps at 900px; right side is breathing room. */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingTop: '1.5rem',
            paddingBottom: '1.5rem',
            paddingLeft: 'var(--content-gutter)',
            paddingRight: 'var(--content-gutter)',
          }}
        >
          <div className="max-w-[var(--content-max-width)]">{children}</div>
        </main>
        <StatusBar />
      </div>
    </div>
  );
    }
