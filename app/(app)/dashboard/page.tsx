import { PurchaseList } from "@/components/dashboard/purchase-list";

export const metadata = {
  title: "Dashboard — ReturnLoop",
  description: "Track active purchases and return deadlines.",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-6 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Purchases
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track deadlines and mark items returned before your window closes.
        </p>
      </div>

      <PurchaseList />
    </div>
  );
}
