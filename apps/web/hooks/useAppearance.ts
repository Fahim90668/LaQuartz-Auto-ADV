'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mode = 'black' | 'obsidian' | 'gray' | 'white';
export type Theme = 'aurora' | 'ember' | 'mint' | 'ink' | 'porcelain';

interface State {
  mode: Mode;
  theme: Theme;
  dialogOpen: boolean;
  setMode: (m: Mode) => void;
  setTheme: (t: Theme) => void;
  openDialog: () => void;
  closeDialog: () => void;
  reset: () => void;
}

const DEFAULT_MODE: Mode = 'obsidian';
const DEFAULT_THEME: Theme = 'aurora';

export const useAppearance = create<State>()(
  persist(
    (set) => ({
      mode: DEFAULT_MODE,
      theme: DEFAULT_THEME,
      dialogOpen: false,
      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      openDialog: () => set({ dialogOpen: true }),
      closeDialog: () => set({ dialogOpen: false }),
      reset: () => set({ mode: DEFAULT_MODE, theme: DEFAULT_THEME }),
    }),
    {
      // v2: accent removed; theme now carries the full palette.
      // Bumping the key discards old accent data.
      name: 'laquartz.appearance.v2',
      partialize: (state) => ({ mode: state.mode, theme: state.theme }),
    },
  ),
);
