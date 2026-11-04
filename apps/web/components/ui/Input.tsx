'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary',
        'transition-colors focus-visible:border-brand-neon',
        invalid ? 'border-danger' : 'border-border-subtle hover:border-border-strong',
        className,
      )}
      {...rest}
    />
  );
});