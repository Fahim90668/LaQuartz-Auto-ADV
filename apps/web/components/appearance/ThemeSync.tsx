'use client';

import { useEffect } from 'react';
import { useAppearance } from '@/hooks/useAppearance';

export function ThemeSync() {
  const mode = useAppearance((s) => s.mode);
  const theme = useAppearance((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-theme', theme);
  }, [mode, theme]);

  return null;
}
