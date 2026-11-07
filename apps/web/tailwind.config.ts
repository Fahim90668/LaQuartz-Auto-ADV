import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          2: 'var(--bg-surface-2)',
          3: 'var(--bg-surface-3)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
          glow: 'var(--border-glow)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          neon: 'var(--brand-neon)',
          pink: 'var(--brand-pink)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },

      /* ── Typography ───────────────────────────────────────────── */
      fontFamily: {
        sans: ['InterVariable', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        /* φ-derived scale */
        'step--2': ['var(--step--2)', { lineHeight: 'var(--lh-meta)' }],
        'step--1': ['var(--step--1)', { lineHeight: 'var(--lh-meta)' }],
        'step-0':  ['var(--step-0)',  { lineHeight: 'var(--lh-body)' }],
        'step-1':  ['var(--step-1)',  { lineHeight: 'var(--lh-snug)' }],
        'step-2':  ['var(--step-2)',  { lineHeight: 'var(--lh-snug)' }],
        'step-3':  ['var(--step-3)',  { lineHeight: 'var(--lh-snug)' }],
        'step-4':  ['var(--step-4)',  { lineHeight: 'var(--lh-tight)' }],
      },

      /* ── Spacing (φ-derived additive layer) ───────────────────── */
      spacing: {
        'phi-1': 'var(--space-phi-1)',
        'phi-2': 'var(--space-phi-2)',
        'phi-3': 'var(--space-phi-3)',
        'phi-4': 'var(--space-phi-4)',
        'phi-5': 'var(--space-phi-5)',
        'phi-6': 'var(--space-phi-6)',
      },

      /* ── Radii ────────────────────────────────────────────────── */
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
      backgroundImage: {
        'grad-brand': 'var(--grad-brand)',
        'grad-surface': 'var(--grad-surface)',
      },
      transitionTimingFunction: {
        panel: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
