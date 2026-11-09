'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, BookOpen, LifeBuoy, MessageCircle } from 'lucide-react';

const FIRST_SECTION_ID = 'getting-started';

const sections = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'core-concepts', title: 'Core Concepts' },
  { id: 'services-247', title: '24/7 Services' },
  { id: 'commands', title: 'Discord Commands' },
  { id: 'faq', title: 'FAQ' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
  { id: 'support', title: 'Support' },
] as const;

export default function DocsPage() {
  const [active, setActive] = useState<string>(FIRST_SECTION_ID);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: 0.1 },
    );
    Object.values(refs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)]">
      <article className="min-w-0">
        <header className="mb-8">
          <h1 className="font-display text-step-3 font-semibold">Documentation</h1>
          <p className="mt-2 max-w-xl text-step-0 text-text-secondary">
            Everything you need to set up LaQuartz AUTO-ADV, run your first
            campaign, configure 24/7 services, and troubleshoot when things
            don&apos;t work. Ten-minute read.
          </p>
        </header>

        {/* ── Getting Started ─────────────────────────────── */}
        <section
          id="getting-started"
          ref={(el) => { refs.current['getting-started'] = el; }}
          className="scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-6"
        >
          <h2 className="font-display text-step-2 font-semibold">Getting Started</h2>
          <p className="mt-2 text-step-0 text-text-secondary">
            From zero to sending ads in under five minutes. Follow these steps in
            order.
          </p>

          <h3 className="mt-5 text-step-1 font-semibold">1. Sign in with Discord</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            On the{' '}
            <a href="/login" className="link-underline text-[color:var(--primary)]">
              login page
            </a>
            , click <strong>Continue with Discord</strong>. This creates your account
            using Discord OAuth. We request only{' '}
            <code className="rounded bg-surface-2 px-1 font-mono text-step--1">
              identify
            </code>{' '}
            and{' '}
            <code className="rounded bg-surface-2 px-1 font-mono text-step--1">email</code>.
          </p>

          <h3 className="mt-5 text-step-1 font-semibold">2. Redeem a code</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Buy a code from our Discord server, then paste it on the{' '}
            <a href="/redeem" className="link-underline text-[color:var(--primary)]">
              Redeem page
            </a>
            . A code grants a specific duration, a max number of playgrounds, and
            optionally 24/7 feature slots.
          </p>

          <h3 className="mt-5 text-step-1 font-semibold">3. Add a Discord account</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Go to{' '}
            <a href="/accounts" className="link-underline text-[color:var(--primary)]">
              Accounts
            </a>{' '}
            and paste a Discord <strong>user token</strong> (not a bot token). We
            validate the token against Discord, then AES-256-GCM encrypt it.
            Ciphertext never leaves the server.
          </p>

          <h3 className="mt-5 text-step-1 font-semibold">4. Create a playground</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            In{' '}
            <a href="/playgrounds" className="link-underline text-[color:var(--primary)]">
              Playgrounds
            </a>
            , click <strong>New</strong>. Pick an account, pick a server and
            channel from the cascading picker (no IDs to copy — servers load
            automatically), add up to 10 message variants. Set interval to manual
            (H/M/S) or leave on slow-mode auto.
          </p>

          <h3 className="mt-5 text-step-1 font-semibold">5. Start sending</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Click <strong>Start</strong>. The worker picks up your playground on its
            next poll (within 1 second). First send happens at{' '}
            <em>now + interval</em>. Watch the live status panel for last sent and
            delivery logs.
          </p>

          <h3 className="mt-5 text-step-1 font-semibold">
            6. Optional — enable 24/7 services
          </h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            If your code grants 24/7 slots, open the{' '}
            <a href="/247" className="link-underline text-[color:var(--primary)]">
              24/7 page
            </a>{' '}
            to keep an account online, in voice, or continuously typing. See the{' '}
            <a href="#services-247" className="link-underline text-[color:var(--primary)]">
              24/7 Services
            </a>{' '}
            section for details.
          </p>
        </section>

        {/* ── Core Concepts ───────────────────────────────── */}
        <section
          id="core-concepts"
          ref={(el) => { refs.current['core-concepts'] = el; }}
          className="mt-6 scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-6"
        >
          <h2 className="font-display text-step-2 font-semibold">Core Concepts</h2>

          <h3 className="mt-4 text-step-1 font-semibold">Account vs. Playground</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            An <strong>account</strong> is a Discord user token you&apos;ve linked.
            A <strong>playground</strong> is a campaign that uses one account to
            send messages across up to 5 channels on a schedule. Each playground
            uses exactly one account — you can create multiple playgrounds from the
            same account up to your license limit.
          </p>

          <h3 className="mt-4 text-step-1 font-semibold">
            Manual interval vs. slow-mode
          </h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            <strong>Manual</strong> uses a fixed interval (minimum 30s, maximum 7
            days) with an H/M/S selector. <strong>Slow-mode</strong> reads
            Discord&apos;s per-channel native rate limit and posts immediately after
            it expires — so you never exceed Discord&apos;s own limits.
          </p>

          <h3 className="mt-4 text-step-1 font-semibold">Message rotation</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Each playground can hold up to 10 message variants. Every send picks
            the next active message in order. This makes repeated posts look
            natural instead of automated.
          </p>

          <h3 className="mt-4 text-step-1 font-semibold">Licenses</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Codes grant a specific duration (lifetime or 7–365 days), a max number
            of playgrounds (1–50), and optional 24/7 feature slots. When a code is
            destroyed, all entitlements tied to it are revoked immediately and any
            running services are paused.
          </p>
        </section>

        {/* ── 24/7 Services ───────────────────────────────── */}
        <section
          id="services-247"
          ref={(el) => { refs.current['services-247'] = el; }}
          className="mt-6 scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-6"
        >
          <h2 className="font-display text-step-2 font-semibold">24/7 Services</h2>
          <p className="mt-2 text-step-0 text-text-secondary">
            24/7 services keep a Discord account active continuously. They&apos;re
            fully managed from the{' '}
            <a href="/247" className="link-underline text-[color:var(--primary)]">
              24/7 page
            </a>{' '}
            — no Discord commands needed. Each service has an expiry time and stops
            automatically.
          </p>

          <h3 className="mt-5 text-step-1 font-semibold">Service types</h3>

          <div className="mt-3 space-y-3">
            <div className="rounded-md border border-border-subtle bg-surface-2 p-3">
              <p className="text-step--1 font-semibold text-text-primary">
                Onliner — keep the account online
              </p>
              <p className="mt-1 text-step--2 text-text-secondary">
                The worker maintains a gateway connection for the account, keeping
                its status set to <code className="rounded bg-surface-3 px-1 font-mono">online</code>,{' '}
                <code className="rounded bg-surface-3 px-1 font-mono">idle</code>,{' '}
                <code className="rounded bg-surface-3 px-1 font-mono">dnd</code>, or{' '}
                <code className="rounded bg-surface-3 px-1 font-mono">invisible</code>.
                The account shows up in every server member list as if you were
                actively using Discord.
              </p>
              <p className="mt-2 text-step--2 text-text-secondary">
                <strong>Custom rich presence</strong> (optional): show a static
                activity under your name. Supported types are{' '}
                <em>Playing</em>, <em>Listening to</em>, <em>Watching</em>,{' '}
                <em>Competing in</em>, and <em>Streaming</em> (streaming requires a
                valid URL). You can set a name, state, and details line.
              </p>
              <p className="mt-2 text-step--2 text-text-secondary">
                <strong>Auto-cycle</strong> (optional): rotate your presence
                through online → idle → dnd every N seconds (30s minimum). The
                activity text stays the same across cycles. Useful if you want the
                account to feel &quot;alive&quot; rather than statically idle.
              </p>
            </div>

            <div className="rounded-md border border-border-subtle bg-surface-2 p-3">
              <p className="text-step--1 font-semibold text-text-primary">
                Typer — keep typing indicator active
              </p>
              <p className="mt-1 text-step--2 text-text-secondary">
                Sends a typing indicator to the selected channel every ~8 seconds.
                Anyone in that channel sees &quot;X is typing…&quot; near the bottom
                — useful for keeping the account visible as &quot;around&quot;
                without actually sending messages.
              </p>
              <p className="mt-2 text-step--2 text-text-secondary">
                The account must have <strong>View Channel</strong> and{' '}
                <strong>Send Messages</strong> permission in the target channel.
              </p>
            </div>

            <div className="rounded-md border border-border-subtle bg-surface-2 p-3">
              <p className="text-step--1 font-semibold text-text-primary">
                VC — stay in a voice channel
              </p>
              <p className="mt-1 text-step--2 text-text-secondary">
                Keeps the account connected to a voice channel. Options for muted,
                deafened, or both. <strong>Currently in beta</strong> — the schema,
                quotas, and UI are ready, but the worker-side implementation is
                pending. VC services will show status{' '}
                <code className="rounded bg-surface-3 px-1 font-mono">error</code>{' '}
                until the voice module ships.
              </p>
            </div>
          </div>

          <h3 className="mt-5 text-step-1 font-semibold">Quotas and expiry</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Each code grants a specific number of slots per feature type: 0 or 1
            Onliner, 0 or 1 VC, 0 or 1 Typer. A user with 1 Onliner slot can have
            one active Onliner service at a time. When they try to create a second,
            the server returns &quot;You have reached the limit for this service
            type.&quot;
          </p>
          <p className="mt-2 text-step-0 text-text-secondary">
            When a service expires, the worker stops the Discord connection and
            marks the row as <code className="rounded bg-surface-2 px-1 font-mono">expired</code>.
            Expired rows stay for 30 days as a record, then are pruned automatically.
            You can also stop a service manually at any time by clicking the{' '}
            <strong>X</strong> on its card.
          </p>

          <h3 className="mt-5 text-step-1 font-semibold">How services run</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Services are executed by a background worker (not the bot, not the web
            panel). The worker polls the database every 5 seconds. When it finds a
            service that isn&apos;t running yet, it decrypts the account&apos;s
            token, opens a connection, and updates the row&apos;s status to{' '}
            <code className="rounded bg-surface-2 px-1 font-mono">active</code>. It
            touches a heartbeat row every 5 seconds so you can see it&apos;s alive.
            When the row reaches its expiry, the worker closes the connection and
            marks it{' '}
            <code className="rounded bg-surface-2 px-1 font-mono">expired</code>.
          </p>
          <p className="mt-2 text-step-0 text-text-secondary">
            Because everything is stored in the database, restarting the worker
            rehydrates cleanly — services resume automatically. You don&apos;t need
            to do anything after a restart.
          </p>
        </section>

        {/* ── Discord Commands ────────────────────────────── */}
        <section
          id="commands"
          ref={(el) => { refs.current['commands'] = el; }}
          className="mt-6 scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-6"
        >
          <h2 className="font-display text-step-2 font-semibold">Discord Commands</h2>
          <p className="mt-2 text-step-0 text-text-secondary">
            Admin-only slash commands, available in the LaQuartz Discord server.
            Note: <strong>24/7 services are NOT managed here</strong> — they live
            entirely on the website.
          </p>

          <h3 className="mt-4 text-step-1 font-semibold">/create-code</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Generate a redeem code.
          </p>
          <ul className="mt-2 space-y-1 text-step-0 text-text-secondary">
            <li>
              <code className="rounded bg-surface-2 px-1 font-mono text-step--1">time</code>{' '}
              — <code className="rounded bg-surface-2 px-1 font-mono text-step--1">lifetime</code>{' '}
              or a number of days between <strong>7</strong> and <strong>365</strong>
            </li>
            <li>
              <code className="rounded bg-surface-2 px-1 font-mono text-step--1">playground</code>{' '}
              — 1 to 50
            </li>
            <li>
              <code className="rounded bg-surface-2 px-1 font-mono text-step--1">feature</code>{' '}
              — <strong>optional</strong>: onliner, vc, typer, or any combination with{' '}
              <code className="rounded bg-surface-2 px-1 font-mono text-step--1">+</code>
            </li>
            <li>
              <code className="rounded bg-surface-2 px-1 font-mono text-step--1">note</code>{' '}
              — optional
            </li>
          </ul>
          <pre className="mt-2 overflow-x-auto rounded-md border border-border-subtle bg-surface-2 p-3 text-step--1 font-mono text-text-secondary">
{`/create-code time:30 playground:5
/create-code time:90 playground:10 feature:onliner+typer
/create-code time:lifetime playground:50 feature:onliner+vc+typer`}
          </pre>

          <h3 className="mt-4 text-step-1 font-semibold">/destroy-code</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Revoke a code immediately. All entitlements tied to it are revoked, and
            any running playgrounds or 24/7 services are paused.
          </p>
          <pre className="mt-2 overflow-x-auto rounded-md border border-border-subtle bg-surface-2 p-3 text-step--1 font-mono text-text-secondary">
{`/destroy-code code:ADVT-QK3Z-W2M7-4AVA`}
          </pre>

          <h3 className="mt-4 text-step-1 font-semibold">/post-update</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Publish a What&apos;s New entry. Appears in the in-app notification bell
            for every user, with unread tracking.
          </p>
          <pre className="mt-2 overflow-x-auto rounded-md border border-border-subtle bg-surface-2 p-3 text-step--1 font-mono text-text-secondary">
{`/post-update title:"Slow-mode improvements" body:"..." version:"1.4.0"`}
          </pre>
        </section>

        {/* ── FAQ ─────────────────────────────────────────── */}
        <section
          id="faq"
          ref={(el) => { refs.current['faq'] = el; }}
          className="mt-6 scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-6"
        >
          <h2 className="font-display text-step-2 font-semibold">
            Frequently Asked Questions
          </h2>

          <dl className="mt-4 space-y-4">
            {[
              {
                q: 'Is my Discord token safe?',
                a: 'Yes. Tokens are encrypted with AES-256-GCM before being written to the database. Only the API and worker can decrypt, in-process, at send time. The token is never sent back to the browser — column-level grants block it at the database layer.',
              },
              {
                q: 'What happens when my code expires?',
                a: 'Your playgrounds are automatically paused and pending sends are cancelled within 1 minute of expiry. Any 24/7 services tied to the entitlement are also stopped. Redeem a new code to resume. No messages are lost — the queue waits.',
              },
              {
                q: 'Can I use the same account for multiple playgrounds?',
                a: 'Yes, but Discord rate-limits per account per channel. Sending from the same account to the same channel from two playgrounds will trigger 429 errors. Use different channels or set intervals long enough to avoid overlap.',
              },
              {
                q: 'How many messages can I queue per playground?',
                a: 'Each playground rotates through up to 10 message variants. The scheduler keeps one job in flight per channel, so you can have 5 channels × 10 variants = 50 distinct messages ready per playground.',
              },
              {
                q: 'What Discord scopes do you request?',
                a: 'OAuth login requests only identify and email. That is the minimum needed to create your account. We never request bot scope on your login — bot functionality is entirely separate.',
              },
              {
                q: 'Do you support slow-mode sync?',
                a: 'Yes. When a playground is set to slow-mode, the worker reads the channel\u2019s native rate_limit_per_user from Discord and schedules the next send for just after it expiresnd email. That is the minimum needed to create your account. We never request bot scope on your login — bot functionality is entirely separate.',
              },
              {
                q: 'Do you support slow-mode sync?',
                a: 'Yes. When a playground is set to slow-mode, the worker reads the channel\u2019s native rate_limit_per_user from Discord and schedules the next send for just after it expires. No 429 errors, no manual tuning.',
              },
            ].map((item, i) => (
              <div key={i}>
                <dt className="text-step-0 font-semibold text-text-primary">{item.q}</dt>
                <dd className="mt-1 text-step-0 text-text-secondary">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Troubleshooting ─────────────────────────────── */}
        <section
          id="troubleshooting"
          ref={(el) => { refs.current['troubleshooting'] = el; }}
          className="mt-6 scroll-mt-24 rounded-lg border border-border-subtle bg-surface p-6"
        >
          <h2 className="font-display text-step-2 font-semibold">Troubleshooting</h2>

          <h3 className="mt-4 text-step-1 font-semibold">&quot;Invalid code&quot; on redeem</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Codes are single-use. If it was already redeemed, destroyed, or you mistyped it,
            generate a new one with <code className="rounded bg-surface-2 px-1 font-mono text-step--1">/create-code</code>.
          </p>

          <h3 className="mt-4 text-step-1 font-semibold">No messages are being sent</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Check, in this order: playground status is <strong>running</strong>, account
            status is <strong>active</strong>, the channel&apos;s <strong>is_active</strong> flag
            is true, at least one message is enabled, and the worker is online (check its
            console for <code className="rounded bg-surface-2 px-1 font-mono text-step--1">scheduler started</code>).
          </p>

          <h3 className="mt-4 text-step-1 font-semibold">Getting 429 / rate-limited errors</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            Discord user tokens have strict per-channel rate limits. Increase your interval to
            5+ minutes, or enable slow-mode sync. The worker will auto-retry with backoff, but
            persistent 429s mean the interval is too aggressive.
          </p>

          <h3 className="mt-4 text-step-1 font-semibold">&quot;Invalid token&quot; errors</h3>
          <p className="mt-1 text-step-0 text-text-secondary">
            The Discord token has been invalidated (password change, manual reset). Delete
            the account in <a href="/accounts" className="link-underline theme-primary">Accounts</a>{' '}
            and re-add it with a fresh token.
          </p>
        </section>

        {/* ── Support ─────────────────────────────────────── */}
        <section
          id="support"
          ref={(el) => { refs.current['support'] = el; }}
          className="mt-6 scroll-mt-24 rounded-lg border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[color:var(--primary)]/15">
              <LifeBuoy className="h-5 w-5 theme-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-step-2 font-semibold">Still stuck?</h2>
              <p className="mt-1 text-step-0 text-text-secondary">
                Our support team and community are active in the LaQuartz Discord server.
                Most questions are answered within an hour during business hours.
              </p>
              <a
                href="https://discord.gg/StJmYFAFyj"
                target="_blank"
                rel="noreferrer noopener"
                className="btn-press mt-4 inline-flex items-center gap-2 rounded-md bg-[image:var(--grad-brand)] px-5 py-2.5 text-step-0 font-medium text-[color:var(--primary-fg)] shadow-md"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Join the Discord
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <div className="mt-8 text-center">
          <a href="/overview" className="btn-press inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-2 px-4 py-2 text-step--1 text-text-secondary hover:text-text-primary">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Back to panel
          </a>
        </div>
      </article>

      {/* Sticky TOC */}
      <aside className="hidden lg:block">
        <div className="sticky top-4">
          <p className="text-step--2 font-medium uppercase tracking-wider text-text-tertiary">
            On this page
          </p>
          <nav className="mt-3 space-y-1" aria-label="Documentation sections">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === s.id ? 'true' : undefined}
                className={
                  'block rounded px-2 py-1.5 text-step--1 transition-colors ' +
                  (active === s.id
                    ? 'bg-[color:var(--primary)]/10 theme-primary font-medium'
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
