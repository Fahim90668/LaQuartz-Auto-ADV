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
} from 'lucide-react';

const features = [
  { icon: Shield, title: 'Encrypted tokens', body: 'AES-256-GCM at rest. Never leaves the server. Only the API and worker decrypt, in-process, when sending.' },
  { icon: Gauge, title: 'Slow-mode native', body: "Reads Discord's native rate limit per channel and reposts just after each window expires." },
  { icon: MessageSquare, title: 'Message rotation', body: 'Up to 10 message variants per playground. Every send picks the next active one, sequencer-safe.' },
  { icon: Sparkles, title: 'Multi-channel', body: 'Up to 5 channels per campaign. A failure in one channel never blocks the others.' },
  { icon: Zap, title: 'Live status', body: 'Delivery logs, latency, and error codes surfaced in real time. See exactly what was sent and when.' },
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(800px circle at 50% 0%, var(--accent, #a020f0) 0%, transparent 65%),' +
            'radial-gradient(600px circle at 15% 80%, var(--break, #22d3ee) 0%, transparent 60%)',
          opacity: 0.14,
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[image:var(--grad-brand)] shadow-glow">
            <Zap className="h-4 w-4 text-[color:var(--accent-fg)]" aria-hidden />
          </div>
          <span className="font-display text-step--1 font-semibold tracking-tight text-text-primary">
            LaQuartz AUTO-ADV
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-step--1">
          <Link
            href="/docs"
            className="hidden text-text-secondary transition-colors hover:text-text-primary sm:inline"
          >
            Docs
          </Link>
          <Link
            href={authenticated ? (hasAccess ? '/overview' : '/redeem') : '/login'}
            className="rounded-md bg-[image:var(--grad-brand)] px-3 py-1.5 font-medium text-[color:var(--accent-fg)] shadow-md transition-all hover:shadow-glow hover:-translate-y-px"
          >
            {authenticated ? (hasAccess ? 'Panel' : 'Redeem') : 'Sign in'}
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-16 text-center sm:pt-24 lg:pt-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 text-step--2 text-text-secondary backdrop-blur-sm">
          <Sparkles className="h-3 w-3 break-color" aria-hidden />
          Multi-account Discord advertising
        </span>

        <h1 className="font-display mt-6 text-step-4 font-semibold tracking-tight text-text-primary">
          Advertising that respects Discord&apos;s limits.
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-step-0 text-text-secondary">
          A license-gated panel for running scheduled messages across multiple servers
          and channels — with slow-mode awareness, encrypted tokens, and a live status
          dashboard.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center gap-2 rounded-md bg-[image:var(--grad-brand)] px-6 py-3 text-step-0 font-medium text-[color:var(--accent-fg)] shadow-lg transition-all hover:shadow-glow hover:-translate-y-px"
          >
            {primaryCta.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface/60 px-6 py-3 text-step-0 text-text-secondary backdrop-blur-sm transition-colors hover:bg-surface-2 hover:text-text-primary"
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
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="font-display text-step-2 font-semibold text-text-primary">
            Everything you need to run the campaigns
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-step-0 text-text-secondary">
            Built for reliability. Every piece you need is native.
          </p>
        </div>

        <div
          className="mt-10 grid gap-3"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              className="reveal group rounded-lg border border-border-subtle bg-surface/70 p-5 backdrop-blur-sm transition-colors hover:border-[color:var(--accent)]/40"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <f.icon className="h-5 w-5 accent-color" aria-hidden />
              <h3 className="font-display mt-3 text-step-1 font-semibold text-text-primary">
                {f.title}
              </h3>
              <p className="mt-1 text-step--1 text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-20 text-center sm:pb-24">
        <div className="rounded-lg border border-border-subtle bg-surface/70 p-8 backdrop-blur-sm sm:p-12">
          <h2 className="font-display text-step-2 font-semibold text-text-primary">
            Ready to start advertising?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-step-0 text-text-secondary">
            Buy a code from our Discord server, redeem it here, and your first
            playground is two minutes away.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={primaryCta.href}
              className="inline-flex items-center gap-2 rounded-md bg-[image:var(--grad-brand)] px-6 py-3 text-step-0 font-medium text-[color:var(--accent-fg)] shadow-lg transition-all hover:shadow-glow hover:-translate-y-px"
            >
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="https://discord.gg/StJmYFAFyj"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface/60 px-6 py-3 text-step-0 text-text-secondary backdrop-blur-sm transition-colors hover:bg-surface-2 hover:text-text-primary"
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
            <Link href="/docs" className="transition-colors hover:text-text-secondary">
              Docs
            </Link>
            <Link href="/login" className="transition-colors hover:text-text-secondary">
              Sign in
            </Link>
            <a
              href="https://discord.gg/StJmYFAFyj"
              target="_blank"
              rel="noreferrer noopener"
              className="transition-colors hover:text-text-secondary"
            >
              Discord
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
   }
