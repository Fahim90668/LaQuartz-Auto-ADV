'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from './cn';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
}

export function Switch({ checked, onCheckedChange, disabled, id, label }: SwitchProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors duration-150',
          checked ? 'bg-brand-primary' : 'bg-surface-3',
          disabled && 'opacity-50',
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-150',
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
          )}
        />
      </SwitchPrimitive.Root>
      {label && (
        <label htmlFor={id} className="text-sm text-text-secondary">
          {label}
        </label>
      )}
    </div>
  );
}