'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from './cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  placeholder = 'Select…',
  options,
  disabled,
  className,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          'inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-3 text-sm text-text-primary transition-colors hover:border-border-strong focus:border-brand-neon',
          disabled && 'opacity-50',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 text-text-tertiary" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border-strong bg-surface-3 shadow-lg"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  'relative flex cursor-pointer items-center rounded-sm px-2 py-2 pr-8 text-sm text-text-secondary outline-none',
                  'data-[highlighted]:bg-surface-2 data-[highlighted]:text-text-primary',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                )}
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2">
                  <Check className="h-4 w-4 text-brand-pink" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}