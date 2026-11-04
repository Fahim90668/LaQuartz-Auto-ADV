'use client';

import { useToast } from '@/hooks/useToast';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from './cn';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toneClass = {
  success: 'border-success/40 text-success',
  error: 'border-danger/40 text-danger',
  warning: 'border-warning/40 text-warning',
  info: 'border-info/40 text-info',
};

export function Toasts() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto animate-toast-in rounded-md border bg-surface-3 p-3 shadow-lg',
              toneClass[t.kind],
            )}
          >
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-text-secondary">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded p-1 text-text-tertiary hover:text-text-primary"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}