'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mode = 'black' | 'obsidian' | 'gray' | 'white';
export type Theme = 'aurora' | 'ember' | 'mint' | 'ink' | 'porcelain';
export type Accent = 'brand' | 'cyan' | 'amber' | 'pink' | 'blue';

/**
 * Default accent per theme. Changing a theme sets the accent to this
 * value, so the UI feels coordinated out of the box ("Ember makes it
 * orange"). The user can still override the accent after choosing a
 * theme — that choice persists until the next theme change.
 */
const THEME_DEFAULT_ACCENT: Record<Theme, Accent> = {
  aurora:    'brand',  // purple
  ember:     'amber',  // orange
  mint:      'pink',
  ink:       'blue',
  porcelain: 'cyan',
};

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

const DEFAULT_MODE: Mode = 'obsidian';
const DEFAULT_THEME: Theme = 'aurora';
const DEFAULT_ACCENT: Accent = THEME_DEFAULT_ACCENT[DEFAULT_THEME];

export const useAppearance = create<State>()(
  persist(
    (set) => ({
      mode: DEFAULT_MODE,
      theme: DEFAULT_THEME,
      accent: DEFAULT_ACCENT,
      dialogOpen: false,

      setMode: (mode) => set({ mode }),

      // Changing theme ALSO sets the matching accent — this is what
      // makes "Ember = orange everywhere" work without a separate step.
      setTheme: (theme) =>
        set({
          theme,
          accent: THEME_DEFAULT_ACCENT[theme],
        }),

      setAccent: (accent) => set({ accent }),

      openDialog: () => set({ dialogOpen: true }),
      closeDialog: () => set({ dialogOpen: false }),

      reset: () =>
        set({
          mode: DEFAULT_MODE,
          theme: DEFAULT_THEME,
          accent: DEFAULT_ACCENT,
        }),
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
