'use client';

import { Check } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { useAppearance, type Mode, type Theme } from '@/hooks/useAppearance';

const MODES: { key: Mode; label: string; hint: string; swatch: string }[] = [
  { key: 'black',    label: 'Full black', hint: 'OLED',    swatch: '#000000' },
  { key: 'obsidian', label: 'Obsidian',   hint: 'Default', swatch: '#0A0710' },
  { key: 'gray',     label: 'Gray',       hint: 'Slate',   swatch: '#1E1F22' },
  { key: 'white',    label: 'White',      hint: 'Light',   swatch: '#FAFAFA' },
];

const THEMES: {
  key: Theme;
  label: string;
  gradient: string;
  palette: { primary: string; neon: string; highlight: string; break: string };
}[] = [
  {
    key: 'aurora',
    label: 'Aurora',
    gradient: 'linear-gradient(180deg, #0A0710 0%, #1A0B2E 50%, #24103A 100%)',
    palette: { primary: '#A020F0', neon: '#BF00FF', highlight: '#E85BFF', break: '#22D3EE' },
  },
  {
    key: 'ember',
    label: 'Ember',
    gradient: 'linear-gradient(180deg, #0C080A 0%, #241019 50%, #351626 100%)',
    palette: { primary: '#F97316', neon: '#FB923C', highlight: '#FDBA74', break: '#FBBF24' },
  },
  {
    key: 'mint',
    label: 'Mint',
    gradient: 'linear-gradient(180deg, #06110F 0%, #0B2922 50%, #123B30 100%)',
    palette: { primary: '#22C55E', neon: '#4ADE80', highlight: '#86EFAC', break: '#F472B6' },
  },
  {
    key: 'ink',
    label: 'Ink',
    gradient: 'linear-gradient(180deg, #080D18 0%, #111D32 50%, #192A43 100%)',
    palette: { primary: '#2563EB', neon: '#60A5FA', highlight: '#93C5FD', break: '#3B82F6' },
  },
  {
    key: 'porcelain',
    label: 'Porcelain',
    gradient: 'linear-gradient(180deg, #FFFFFF 0%, #F0F6FA 50%, #EAF5EE 100%)',
    palette: { primary: '#0EA5E9', neon: '#10B981', highlight: '#86EFAC', break: '#10B981' },
  },
];

export function AppearanceDialog() {
  const mode = useAppearance((s) => s.mode);
  const theme = useAppearance((s) => s.theme);
  const dialogOpen = useAppearance((s) => s.dialogOpen);
  const closeDialog = useAppearance((s) => s.closeDialog);
  const setMode = useAppearance((s) => s.setMode);
  const setTheme = useAppearance((s) => s.setTheme);
  const reset = useAppearance((s) => s.reset);

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => { if (!open) closeDialog(); }}
      title="Appearance"
      description="Base mode changes surfaces. Theme changes the full color identity."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
          <Button variant="secondary" size="sm" onClick={closeDialog}>Done</Button>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <h4 className="mb-3 text-step--2 font-medium uppercase tracking-wider text-text-tertiary">
            Base mode
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                aria-pressed={mode === m.key}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 rounded-md border p-3 transition',
                  mode === m.key
                    ? 'border-[color:var(--neon)] ring-1 ring-[color:var(--neon)]'
                    : 'border-border-subtle hover:border-border-strong',
                )}
              >
                <span
                  className="h-10 w-full rounded-md border border-border-subtle"
                  style={{ background: m.swatch }}
                />
                <span className="text-step--1 font-medium text-text-primary">{m.label}</span>
                <span className="text-step--2 text-text-tertiary">{m.hint}</span>
                {mode === m.key && (
                  <Check className="absolute right-1.5 top-1.5 h-3 w-3 theme-highlight" />
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-step--2 font-medium uppercase tracking-wider text-text-tertiary">
            Theme
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                aria-pressed={theme === t.key}
                className={cn(
                  'group relative flex flex-col gap-2 rounded-md border p-3 text-left transition',
                  theme === t.key
                    ? 'border-[color:var(--neon)] ring-1 ring-[color:var(--neon)]'
                    : 'border-border-subtle hover:border-border-strong',
                )}
              >
                <div
                  className="h-16 w-full rounded-md"
                  style={{ background: t.gradient }}
                  aria-hidden
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-step--1 font-medium text-text-primary">{t.label}</span>
                  <div className="flex items-center gap-1">
                    <span
                      className="h-3 w-3 rounded-full ring-1 ring-black/20"
                      style={{ background: t.palette.primary }}
                      title={`primary ${t.palette.primary}`}
                    />
                    <span
                      className="h-3 w-3 rounded-full ring-1 ring-black/20"
                      style={{ background: t.palette.neon }}
                      title={`neon ${t.palette.neon}`}
                    />
                    <span
                      className="h-3 w-3 rounded-full ring-1 ring-black/20"
                      style={{ background: t.palette.highlight }}
                      title={`highlight ${t.palette.highlight}`}
                    />
                    <span
                      className="h-3 w-3 rounded-full ring-1 ring-black/20"
                      style={{ background: t.palette.break }}
                      title={`break ${t.palette.break}`}
                    />
                  </div>
                </div>
                {theme === t.key && (
                  <Check className="absolute right-2 top-2 h-4 w-4 theme-highlight drop-shadow" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-step--2 text-text-tertiary">
            Each theme ships its own palette. The <strong className="text-text-secondary">break</strong> color
            (4th dot) is reserved for idle/paused state — never for primary actions.
          </p>
        </section>
      </div>
    </Dialog>
  );
  }
