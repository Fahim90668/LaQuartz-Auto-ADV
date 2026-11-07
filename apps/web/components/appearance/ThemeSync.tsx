'use client';

import { useEffect } from 'react';
import { useAppearance } from '@/hooks/useAppearance';

/**
 * Applies the current appearance state to <html> as data attributes.
 * Idempotent — safe to run after the inline no-FOUC script has already
 * set them. Ensures runtime theme changes (from the dialog) take effect.
 */
export function ThemeSync() {
  const mode = useAppearance((s) => s.mode);
  const theme = useAppearance((s) => s.theme);
  const accent = useAppearance((s) => s.accent);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-accent', accent);
  }, [mode, theme, accent]);

  return null;
}
