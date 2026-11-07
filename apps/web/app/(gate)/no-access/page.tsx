import { NoAccessCard } from '@/components/redeem/NoAccessCard';
import { requireUser } from '@/lib/guards';

export default async function NoAccessPage() {
  await requireUser();
  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <NoAccessCard />
    </div>
  );
}
