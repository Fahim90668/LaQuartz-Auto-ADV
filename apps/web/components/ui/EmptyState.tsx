import { type ReactNode } from 'react';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-subtle bg-surface/50 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-brand-pink">
        {icon}
      </div>
      <div>
        <p className="text-h3 font-semibold text-text-primary">{title}</p>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}