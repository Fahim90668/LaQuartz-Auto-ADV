import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border-subtle">
      <table className={cn('w-full border-collapse text-sm', className)}>{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-2">{children}</thead>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'border-b border-border-subtle px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-text-tertiary',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('border-b border-border-subtle last:border-0 hover:bg-surface-2/60', className)}
      {...rest}
    />
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3 text-text-secondary', className)}>{children}</td>
  );
}