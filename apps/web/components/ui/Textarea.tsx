'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'min-h-[100px] w-full resize-y rounded-md border bg-surface p-3 text-sm text-text-primary placeholder:text-text-tertiary',
          'transition-colors focus-visible:border-brand-neon',
          invalid ? 'border-danger' : 'border-border-subtle hover:border-border-strong',
          className,
        )}
        {...rest}
      />
    );
  },
);