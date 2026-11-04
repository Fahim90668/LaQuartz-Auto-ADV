import { NoAccessCard } from '@/components/redeem/NoAccessCard';
import { requireUser } from '@/lib/guards';

export default async function NoAccessPage() {
  await requireUser();
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <NoAccessCard />
    </div>
  );
}