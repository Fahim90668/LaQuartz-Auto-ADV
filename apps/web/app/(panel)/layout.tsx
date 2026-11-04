import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBar } from '@/components/layout/StatusBar';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[var(--content-max-width)]">{children}</div>
        </main>
        <StatusBar />
      </div>
    </div>
  );
}