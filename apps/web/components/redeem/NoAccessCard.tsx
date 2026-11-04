import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';

const INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE ?? 'https://discord.gg/your-invite';

export function NoAccessCard() {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border border-border-subtle bg-surface p-8 text-center shadow-md">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
        <ShoppingBag className="h-7 w-7 text-brand-pink" />
      </div>
      <div>
        <h2 className="text-h2 font-semibold text-text-primary">Buy a code from our Discord server</h2>
        <p className="mt-2 text-sm text-text-secondary">
          You need a valid code to access the panel. Join our Discord server, purchase a code, then
          come back here to redeem it.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href={INVITE}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[image:var(--grad-brand)] px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-glow hover:-translate-y-px"
        >
          Join our Discord <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/redeem"
          className="rounded-md border border-border-subtle bg-surface-2 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
        >
          Already have a code? Redeem it →
        </Link>
      </div>
    </div>
  );
}