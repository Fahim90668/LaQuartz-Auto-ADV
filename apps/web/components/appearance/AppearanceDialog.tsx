'use client';

import { Check } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { useAppearance, type Mode, type Theme, type Accent } from '@/hooks/useAppearance';

const MODES: { key: Mode; label: string; hint: string; swatch: string }[] = [
  { key: 'black',    label: 'Full black', hint: 'OLED-friendly', swatch: '#000000' },
  { key: 'obsidian', label: 'Obsidian',   hint: 'Default',       swatch: '#0A0710' },
  { key: 'gray',     label: 'Gray',       hint: 'Discord-style', swatch: '#1E1F22' },
  { key: 'white',    label: 'White',      hint: 'Light',         swatch: '#FAFAFA' },
];

const THEMES: { key: Theme; label: string; swatch: string; breakColor: string }[] = [
  { key: 'aurora',    label: 'Aurora',    swatch: 'linear-gradient(180deg,#0A0710,#1A0B2E)', breakColor: '#22D3EE' },
  { key: 'ember',     label: 'Ember',     swatch: 'linear-gradient(180deg,#0F0505,#2D0F0F)', breakColor: '#F59E0B' },
  { key: 'mint',      label: 'Mint',      swatch: 'linear-gradient(180deg,#051210,#0A2A24)', breakColor: '#F472B6' },
  { key: 'ink',       label: 'Ink',       swatch: 'linear-gradient(180deg,#0A0A0A,#1A1A1A)', breakColor: '#3B82F6' },
  { key: 'porcelain', label: 'Porcelain', swatch: 'linear-gradient(180deg,#FAFAFA,#F5F5F7)', breakColor: '#06B6D4' },
];

const ACCENTS: { key: Accent; label: string; color: string }[] = [
  { key: 'brand', label: 'Brand', color: '#E85BFF' },
  { key: 'cyan',  label: 'Cyan',  color: '#22D3EE' },
  { key: 'amber', label: 'Amber', color: '#F59E0B' },
  { key: 'pink',  label: 'Pink',  color: '#F472B6' },
  { key: 'blue',  label: 'Blue',  color: '#3B82F6' },
];

export function AppearanceDialog() {
  const mode = useAppearance((s) => s.mode);
  const theme = useAppearance((s) => s.theme);
  const accent = useAppearance((s) => s.accent);
  const dialogOpen = useAppearance((s) => s.dialogOpen);
  const closeDialog = useAppearance((s) => s.closeDialog);
  const setMode = useAppearance((s) => s.setMode);
  const setTheme = useAppearance((s) => s.setTheme);
  const setAccent = useAppearance((s) => s.setAccent);
  const reset = useAppearance((s) => s.reset);

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
      title="Appearance"
      description="Customize the panel theme. Saved to this browser only."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset to defaults
          </Button>
          <Button variant="secondary" size="sm" onClick={closeDialog}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Base mode */}
        <section>
          <h4 className="mb-2 text-step--2 uppercase tracking-wider text-text-tertiary">
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
                    ? 'border-[var(--break)] ring-1 ring-[var(--break)]'
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
                  <Check className="absolute right-1.5 top-1.5 h-3 w-3 break-color" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Gradient theme */}
        <section>
          <h4 className="mb-2 text-step--2 uppercase tracking-wider text-text-tertiary">
            Gradient theme
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                aria-pressed={theme === t.key}
                className={cn(
                  'group relative flex flex-col gap-2 rounded-md border p-3 text-left transition',
                  theme === t.key
                    ? 'border-[var(--break)] ring-1 ring-[var(--break)]'
                    : 'border-border-subtle hover:border-border-strong',
                )}
              >
                <span className="h-12 w-full rounded-md" style={{ background: t.swatch }} />
                <div className="flex items-center justify-between">
                  <span className="text-step--1 font-medium text-text-primary">{t.label}</span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: t.breakColor }}
                    aria-hidden
                  />
                </div>
                {theme === t.key && (
                  <Check className="absolute right-2 top-2 h-3 w-3 break-color" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Accent */}
        <section>
          <h4 className="mb-2 text-step--2 uppercase tracking-wider text-text-tertiary">Accent</h4>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setAccent(a.key)}
                aria-pressed={accent === a.key}
                aria-label={a.label}
                title={a.label}
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition',
                  accent === a.key
                    ? 'border-text-primary'
                    : 'border-border-subtle hover:border-border-strong',
                )}
                style={
                  accent === a.key
                    ? { boxShadow: `0 0 0 2px ${a.color}` }
                    : undefined
                }
              >
                <span className="h-6 w-6 rounded-full" style={{ background: a.color }} />
              </button>
            ))}
          </div>
          <p className="mt-2 text-step--2 text-text-tertiary">
            Used on decorative highlights and the notification badge.
          </p>
        </section>

        <section className="rounded-md border border-border-subtle bg-surface-2/50 p-3">
          <p className="text-step--2 text-text-tertiary">
            <strong className="text-text-secondary">Note:</strong> Appearance is saved to this
            browser only. Signing in on another device starts fresh. Backend sync via{' '}
            <code className="rounded bg-surface-3 px-1 font-mono text-text-secondary">
              profiles.appearance
            </code>{' '}
            is planned.
          </p>
        </section>
      </div>
    </Dialog>
  );
}
