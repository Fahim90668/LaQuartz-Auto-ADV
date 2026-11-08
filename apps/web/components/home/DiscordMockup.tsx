'use client';

import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';

interface Message {
  id: string;
  author: string;
  avatar: string;
  color: string;
  bot: boolean;
  time: string;
  content: string;
}

const STEPS: Message[] = [
  {
    id: '1',
    author: 'LaQuartz Bot',
    avatar: 'LQ',
    color: '#A020F0',
    bot: true,
    time: 'Today at 14:32',
    content: '✅ **Playground started** — "Gaming Hub Promo" is now running on **#general**.',
  },
  {
    id: '2',
    author: 'Ad Account',
    avatar: 'GA',
    color: '#22C55E',
    bot: false,
    time: 'Today at 14:33',
    content: '🎮 Join our community! We host weekly tournaments, giveaways, and game nights.\n> discord.gg/laquartz',
  },
  {
    id: '3',
    author: 'LaQuartz Bot',
    avatar: 'LQ',
    color: '#A020F0',
    bot: true,
    time: 'Today at 14:33',
    content: '📊 **Delivery logged** — message id `1122334455` · 182ms · next send in **5m 00s**.',
  },
];

export function DiscordMockup() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-lg">
      {/* Channel header */}
      <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-2 px-4 py-3">
        <span className="text-step--2 text-text-tertiary">#</span>
        <span className="text-step--1 font-medium text-text-primary">general</span>
        <span className="ml-1 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-text-tertiary">
          live preview
        </span>
      </div>

      {/* Messages */}
      <ul className="space-y-4 bg-surface p-4">
        {STEPS.map((m, i) => (
          <li
            key={m.id}
            className="flex gap-3"
            style={
              reduced
                ? undefined
                : {
                    animation: `step-cycle 12s ease-in-out infinite`,
                    animationDelay: `${i * 4}s`,
                  }
            }
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-step--2 font-semibold text-white"
              style={{ backgroundColor: m.color }}
              aria-hidden
            >
              {m.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-step--1 font-medium" style={{ color: m.color }}>
                  {m.author}
                </span>
                {m.bot && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-[color:var(--primary)]/15 px-1 py-px text-[10px] font-medium text-[color:var(--primary)]">
                    <Bot className="h-2.5 w-2.5" aria-hidden /> BOT
                  </span>
                )}
                <span className="text-[11px] text-text-tertiary">{m.time}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-step--1 text-text-secondary">
                {m.content}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
  }
