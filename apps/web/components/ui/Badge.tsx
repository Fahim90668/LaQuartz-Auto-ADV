import { type HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-text-secondary border-border-subtle',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  brand: 'bg-brand-primary/10 text-brand-pink border-brand-primary/30',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-xs font-medium uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}