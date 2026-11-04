import { RedeemForm } from '@/components/redeem/RedeemForm';
import { requireUser } from '@/lib/guards';

export default async function RedeemPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-md">
      <RedeemForm />
    </div>
  );
}