'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from './cn';

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...rest
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('flex gap-1 border-b border-border-subtle', className)}
      {...rest}
    />
  );
}

export function TabsTrigger({
  className,
  ...rest
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative px-3 py-2 text-sm text-text-tertiary transition-colors hover:text-text-secondary',
        'data-[state=active]:text-text-primary',
        'after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:bg-transparent after:transition-colors',
        'data-[state=active]:after:bg-brand-neon',
        className,
      )}
      {...rest}
    />
  );
}

export function TabsContent({
  className,
  ...rest
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content className={cn('mt-4', className)} {...rest} />
  );
}