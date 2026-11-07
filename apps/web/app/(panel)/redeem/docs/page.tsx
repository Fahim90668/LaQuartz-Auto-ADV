'use client';

import { useEffect, useRef, useState } from 'react';

const sections = [
  { id: 'getting-started',  title: 'Getting Started' },
  { id: 'features',         title: 'Features' },
  { id: 'faq',              title: 'FAQ' },
  { id: 'troubleshooting',  title: 'Troubleshooting' },
];

export default function DocsPage() {
  const [active, setActive] = useState(sections[0].id);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0.1 },
    );
    Object.values(refs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
      <article className="min-w-0 space-y-5">
        <header>
          <h1 className="text-step-3 font-semibold text-text-primary">Documentation</h1>
          <p className="mt-2 text-step-0 text-text-secondary">
            Everything you need to set up, configure, and troubleshoot LaQuartz AUTO-ADV.
          </p>
        </header>

        <section
          id="getting-started"
          ref={(el) => { refs.current['getting-started'] = el; }}
          className="scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-5"
        >
          <h2 className="text-step-2 font-semibold text-text-primary">Getting Started</h2>
          <p className="mt-3 text-step-0 text-text-secondary">
            Follow these steps in order to get your first campaign running.
          </p>
          <ol className="mt-3 space-y-2 text-step-0 text-text-secondary">
            <li><strong className="text-text-primary">1.</strong> Log in with Discord — this creates your account.</li>
            <li><strong className="text-text-primary">2.</strong> Redeem a code from the Redeem page — this unlocks the panel.</li>
            <li><strong className="text-text-primary">3.</strong> Add a Discord account in the Accounts page — your token is encrypted at rest.</li>
            <li><strong className="text-text-primary">4.</strong> Create a Playground in the Playgrounds page — pick account, channel, message, and interval.</li>
            <li><strong className="text-text-primary">5.</strong> Click <strong className="text-text-primary">Start</strong> — the worker will begin sending on schedule.</li>
          </ol>
        </section>

        <section
          id="features"
          ref={(el) => { refs.current['features'] = el; }}
          className="scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-5"
        >
          <h2 className="text-step-2 font-semibold text-text-primary">Features</h2>
          <ul className="mt-3 space-y-2 text-step-0 text-text-secondary">
            <li><strong className="text-text-primary">Multi-channel rotation</strong> — up to 5 channels per playground.</li>
            <li><strong className="text-text-primary">Message rotation</strong> — up to 10 message variants per playground.</li>
            <li><strong className="text-text-primary">Slow-mode sync</strong> — reads the channel's native rate limit and posts just after each window.</li>
            <li><strong className="text-text-primary">Encrypted tokens</strong> — AES-256-GCM at rest, never returned to the browser.</li>
            <li><strong className="text-text-primary">Live status</strong> — last sent time, next scheduled, and errors surfaced in real time.</li>
            <li><strong className="text-text-primary">Automatic recovery</strong> — the worker rehydrates its queue on boot, no manual rescheduling.</li>
          </ul>
        </section>

        <section
          id="faq"
          ref={(el) => { refs.current['faq'] = el; }}
          className="scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-5"
        >
          <h2 className="text-step-2 font-semibold text-text-primary">FAQ</h2>
          <dl className="mt-3 space-y-3 text-step-0">
            <div>
              <dt className="font-medium text-text-primary">Where do I get a code?</dt>
              <dd className="text-text-secondary">From our Discord server. See the Redeem page for the invite link.</dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">Is my Discord token safe?</dt>
              <dd className="text-text-secondary">Yes. Tokens are AES-256-GCM encrypted at rest and never sent back to the browser. Only the API and worker decrypt them, in-process, when sending a message.</dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">What happens when my code expires?</dt>
              <dd className="text-text-secondary">Your playgrounds are automatically paused and pending sends are cancelled. Redeem a new code to resume.</dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">Can I use the same account for multiple playgrounds?</dt>
              <dd className="text-text-secondary">Yes, but each account can only send one message per channel at a time. Use different channels or stagger intervals to avoid rate limits.</dd>
            </div>
          </dl>
        </section>

        <section
          id="troubleshooting"
          ref={(el) => { refs.current['troubleshooting'] = el; }}
          className="scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-5"
        >
          <h2 className="text-step-2 font-semibold text-text-primary">Troubleshooting</h2>
          <dl className="mt-3 space-y-3 text-step-0">
            <div>
              <dt className="font-medium text-text-primary">"Invalid code" on redeem</dt>
              <dd className="text-text-secondary">
                Codes are single-use. If it was already redeemed or destroyed, generate a new one with{' '}
                <code className="rounded bg-surface-2 px-1 font-mono text-step--1">/create-code</code>.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">No messages being sent</dt>
              <dd className="text-text-secondary">
                Check: playground status is{' '}
                <code className="rounded bg-surface-2 px-1 font-mono text-step--1">running</code>,
                account status is{' '}
                <code className="rounded bg-surface-2 px-1 font-mono text-step--1">active</code>,
                the channel{' '}
                <code className="rounded bg-surface-2 px-1 font-mono text-step--1">is_active</code>{' '}
                flag is true, and at least one message is enabled.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">"Invalid token" errors</dt>
              <dd className="text-text-secondary">The Discord token has been invalidated. Delete the account and re-add it with a fresh token.</dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">Rate-limited sends</dt>
              <dd className="text-text-secondary">Discord user tokens have strict rate limits. Use intervals of 5+ minutes, or enable slow-mode sync.</dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">Worker seems offline</dt>
              <dd className="text-text-secondary">
                Check the worker console for{' '}
                <code className="rounded bg-surface-2 px-1 font-mono text-step--1">scheduler started</code>.
                If silent, restart the worker server.
              </dd>
            </div>
          </dl>
        </section>
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-4">
          <p className="text-step--2 uppercase tracking-wider text-text-tertiary">On this page</p>
          <nav className="mt-2 space-y-1" aria-label="Documentation sections">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === s.id ? 'true' : undefined}
                className={
                  'block rounded px-2 py-1 text-step--1 transition-colors ' +
                  (active === s.id
                    ? 'bg-brand-primary/10 accent-color'
                    : 'text-text-secondary hover:text-text-primary')
                }
              >
                {s.title}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
            }
