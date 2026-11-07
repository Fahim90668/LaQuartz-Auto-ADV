'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mode = 'black' | 'obsidian' | 'gray' | 'white';
export type Theme = 'aurora' | 'ember' | 'mint' | 'ink' | 'porcelain';
export type Accent = 'brand' | 'cyan' | 'amber' | 'pink' | 'blue';

interface State {
  mode: Mode;
  theme: Theme;
  accent: Accent;
  dialogOpen: boolean;
  setMode: (m: Mode) => void;
  setTheme: (t: Theme) => void;
  setAccent: (a: Accent) => void;
  openDialog: () => void;
  closeDialog: () => void;
  reset: () => void;
}

const DEFAULTS = {
  mode: 'obsidian' as Mode,
  theme: 'aurora' as Theme,
  accent: 'brand' as Accent,
};

export const useAppearance = create<State>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      dialogOpen: false,
      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      openDialog: () => set({ dialogOpen: true }),
      closeDialog: () => set({ dialogOpen: false }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'laquartz.appearance.v1',
      partialize: (state) => ({
        mode: state.mode,
        theme: state.theme,
        accent: state.accent,
      }),
    },
  ),
);
