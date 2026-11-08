'use client';

import Link from 'next/link';
import {
  Zap,
  Shield,
  Gauge,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  PlayCircle,
} from 'lucide-react';
import { DiscordMockup } from './DiscordMockup';

const features = [
  { icon: Shield, title: 'Encrypted tokens', body: 'AES-256-GCM at rest. Never sent back to the browser. Decrypted only in API and worker, in-process, at send time.' },
  { icon: Gauge, title: 'Slow-mode native', body: 'Reads Discord\u2019s native rate limit per channel and reposts just after each window expires. No spam, no bans.' },
  { icon: MessageSquare, title: 'Message rotation', body: 'Up to 10 message variants per playground. Each send picks the next active one so repeated posts never look automated.' },
  { icon: Sparkles, title: 'Multi-channel', body: 'Up to 5 channels per campaign. A failure in one channel never blocks the others. Isolated delivery errors.' },
  { icon: Zap, title: 'Live status', body: 'Delivery logs, latency, and error codes surfaced in real time. Every send is auditable down to the millisecond.' },
  { icon: CheckCircle2, title: 'License-backed', body: 'Redeem codes with per-account playground limits. Destroyed codes revoke access immediately.' },
];

export interface HomeContentProps {
  authenticated: boolean;
  hasAccess: boolean;
}

export function HomeContent({ authenticated, hasAccess }: HomeContentProps) {
  const primaryCta = !authenticated
    ? { href: '/login', label: 'Continue with Discord' }
    : hasAccess
      ? { href: '/overview', label: 'Open the panel' }
      : { href: '/redeem', label: 'Redeem a code' };

  return (
    <div className="app-shell relative min-h-screen overflow-hidden">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[image:var(--grad-brand)] shadow-glow">
            <Zap className="h-4 w-4 text-[color:var(--primary-fg)]" aria-hidden />
          </div>
          <span className="font-display text-step--1 font-semibold tracking-tight text-text-primary">
            LaQuartz AUTO-ADV
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-step--1">
          <Link href="/docs" className="link-underline hidden text-text-secondary sm:inline">
            Docs
          </Link>
          <Link
            href={authenticated ? (hasAccess ? '/overview' : '/redeem') : '/login'}
            className="btn-press rounded-md bg-[image:var(--grad-brand)] px-3 py-1.5 font-medium text-[color:var(--primary-fg)] shadow-md"
          >
            {authenticated ? (hasAccess ? 'Panel' : 'Redeem') : 'Sign in'}
          </Link>
        </nav>
      </header>

      {/* Hero: 2-col golden-ratio split (0.618 / 0.382) */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-12 sm:pt-16 lg:pt-20">
        <div
          className="grid items-center gap-10 lg:gap-12"
          style={{ gridTemplateColumns: 'minmax(0, 1.618fr) minmax(0, 1fr)' }}
        >
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 text-step--2 text-text-secondary backdrop-blur-sm">
              <Sparkles className="h-3 w-3 theme-highlight" aria-hidden />
              Multi-account Discord advertising
            </span>

            <h1 className="font-display mt-5 text-step-4 font-semibold tracking-tight">
              Advertising that respects Discord&apos;s limits.
            </h1>

            <p className="mt-4 max-w-xl text-step-0 text-text-secondary">
              A license-gated panel for running scheduled messages across multiple servers
              and channels — with slow-mode awareness, encrypted tokens, and a live
              status dashboard.
            </p>

            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                href={primaryCta.href}
                className="btn-press inline-flex items-center gap-2 rounded-md bg-[image:var(--grad-brand)] px-5 py-2.5 text-step-0 font-medium text-[color:var(--primary-fg)] shadow-lg"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/docs"
                className="btn-press inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface/60 px-5 py-2.5 text-step-0 text-text-secondary backdrop-blur-sm hover:text-text-primary"
              >
                <BookOpen className="h-4 w-4" aria-hidden />
                Read the docs
              </Link>
            </div>

            {authenticated && (
              <p className="mt-4 text-step--2 text-text-tertiary">
                Signed in.{' '}
                {hasAccess ? 'Your panel is ready.' : 'Redeem a code to unlock the panel.'}
              </p>
            )}
          </div>

          {/* Hero visual — pop-in with slight rotation for "real" feel */}
          <div className="animate-pop-in" style={{ animationDelay: '150ms' }}>
            <div className="relative mx-auto w-full max-w-[340px] lg:max-w-none">
              {/* Ambient glow behind the card */}
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-lg blur-2xl opacity-30"
                style={{ background: 'var(--grad-brand)' }}
              />
              <div className="rounded-lg border border-border-subtle bg-surface p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-step--2 uppercase tracking-wider text-text-tertiary">
                    Playground · live
                  </span>
                  <span className="flex items-center gap-1 text-step--2 text-text-secondary">
                    <span className="status-live h-1.5 w-1.5 rounded-full animate-pulse-dot" />
                    running
                  </span>
                </div>
                <p className="text-step--1 font-medium text-text-primary">Gaming Hub Promo</p>
                <div className="mt-3 space-y-1.5 text-step--2 text-text-tertiary">
                  <p>· <span className="text-text-secondary">#general</span> · #announcements</p>
                  <p>· next send in 04:58</p>
                  <p>· 42 sent · 0 failed</p>
                </div>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full w-2/3 rounded-full" style={{ background: 'var(--grad-brand)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — Discord mockup */}
      <section className="relative z-10 mx-auto mt-20 max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-step-2 font-semibold">How it works, in three steps</h2>
          <p className="mx-auto mt-2 max-w-xl text-step-0 text-text-secondary">
            You create a playground. The worker sends on schedule. Discord sees a message
            from your account — not a bot. Every send is logged.
          </p>
        </div>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {[
              { n: '01', title: 'Start a playground', body: 'Pick an account, up to 5 channels, up to 10 message variants. Choose manual interval or automatic slow-mode sync.' },
              { n: '02', title: 'Worker schedules and sends', body: 'A background worker polls a durable queue. Sends happen from your Discord account — respecting per-channel rate limits.' },
              { n: '03', title: 'Every send is auditable', body: 'Delivery logs, latency, error codes, retries — all in the panel. Nothing is sent without a record.' },
            ].map((step) => (
              <div key={step.n} className="flex gap-4">
                <span className="font-display text-step-3 font-semibold leading-none theme-primary">{step.n}</span>
                <div>
                  <h3 className="font-display text-step-1 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-step--1 text-text-secondary">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <DiscordMockup />
            <p className="mt-3 text-center text-step--2 text-text-tertiary">
              <PlayCircle className="mr-1 inline h-3 w-3" aria-hidden />
              Loops every 12 seconds · respects reduced motion
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-step-2 font-semibold">
            Everything you need to run the campaigns
          </h2>
          <p className="mt-2 text-step-0 text-text-secondary">
            Built for reliability. Every piece you need is native.
          </p>
        </div>

        <div
          className="mt-10 grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              className="reveal rounded-lg border border-border-subtle bg-surface/70 p-5 backdrop-blur-sm transition-colors hover:border-[color:var(--primary)]/40"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <f.icon className="h-5 w-5 theme-primary" aria-hidden />
              <h3 className="font-display mt-3 text-step-1 font-semibold">{f.title}</h3>
              <p className="mt-1 text-step--1 text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-lg border border-border-subtle bg-surface/70 p-8 text-center backdrop-blur-sm sm:p-12">
          <h2 className="font-display text-step-2 font-semibold">Ready to start advertising?</h2>
          <p className="mx-auto mt-2 max-w-xl text-step-0 text-text-secondary">
            Buy a code from our Discord server, redeem it here, and your first
            playground is two minutes away.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryCta.href}
              className="btn-press inline-flex items-center gap-2 rounded-md bg-[image:var(--grad-brand)] px-6 py-3 text-step-0 font-medium text-[color:var(--primary-fg)] shadow-lg"
            >
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="https://discord.gg/StJmYFAFyj"
              target="_blank"
              rel="noreferrer noopener"
              className="btn-press inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface/60 px-6 py-3 text-step-0 text-text-secondary backdrop-blur-sm hover:text-text-primary"
            >
              Join our Discord
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border-subtle px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-step--2 text-text-tertiary sm:flex-row">
          <p>© {new Date().getFullYear()} LaQuartz AUTO-ADV. All rights reserved.</p>
          <nav className="flex items-center gap-4" aria-label="Footer">
            <Link href="/docs" className="link-underline hover:text-text-secondary">Docs</Link>
            <Link href="/login" className="link-underline hover:text-text-secondary">Sign in</Link>
            <a href="https://discord.gg/StJmYFAFyj" target="_blank" rel="noreferrer noopener" className="link-underline hover:text-text-secondary">Discord</a>
          </nav>
        </div>
      </footer>
    </div>
  );
   }
