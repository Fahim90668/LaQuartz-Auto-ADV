'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { formatRelative } from '@/lib/formatters';
import { cn } from '@/components/ui/cn';
import {
  useUpdates,
  useReadUpdates,
  useMarkUpdateRead,
  useMarkAllRead,
} from '@/hooks/useUpdates';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: updates = [], isLoading } = useUpdates();
  const { data: reads = [] } = useReadUpdates();
  const markRead = useMarkUpdateRead();
  const markAllRead = useMarkAllRead();

  const unreadIds = updates.filter((u) => !reads.includes(u.id)).map((u) => u.id);
  const unreadCount = unreadIds.length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'btn-press relative rounded-md p-2 transition-colors',
          'text-[color:var(--break)]',           /* bell icon = break color, contrasts with theme */
          'hover:bg-surface-2',
        )}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
            style={{
              backgroundColor: 'var(--primary)',   /* badge = theme primary */
              color: 'var(--primary-fg)',
            }}
            aria-hidden
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="What's New"
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-[min(92vw,360px)]',
            'rounded-md border border-border-strong bg-surface-3 shadow-lg',
            'animate-modal-in',
          )}
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
            <p className="text-step--1 font-semibold text-[color:var(--header)]">
              What&apos;s New
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate(unreadIds)}
                disabled={markAllRead.isPending}
                className="text-step--2 break-color transition-opacity hover:opacity-80"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-[min(70vh,480px)] overflow-y-auto overscroll-contain">
            {isLoading && (
              <li className="px-4 py-6 text-center text-step--1 text-text-tertiary">Loading…</li>
            )}
            {!isLoading && updates.length === 0 && (
              <li className="px-4 py-8 text-center text-step--1 text-text-tertiary">Nothing yet.</li>
            )}
            {updates.map((u) => {
              const isRead = reads.includes(u.id);
              return (
                <li
                  key={u.id}
                  className={cn(
                    'border-b border-border-subtle px-4 py-3 last:border-0',
                    isRead ? 'opacity-60' : '',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-step--1 font-medium text-text-primary">{u.title}</p>
                    {!isRead && (
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: 'var(--break)' }}
                        aria-label="Unread"
                      />
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-step--2 text-text-secondary">{u.body}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-step--2 text-text-tertiary">
                      {u.version ? `v${u.version} · ` : ''}{formatRelative(u.published_at)}
                    </span>
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(u.id)}
                        disabled={markRead.isPending}
                        className="flex items-center gap-1 text-step--2 break-color transition-opacity hover:opacity-80"
                      >
                        <Check className="h-3 w-3" aria-hidden /> Mark read
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
