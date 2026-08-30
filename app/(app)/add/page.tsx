import { Card } from "@/components/ui/card";
import { ManualAddForm } from "@/components/purchase/manual-add-form";

export const metadata = {
  title: "Add Purchase — ReturnLoop",
  description: "Track a new purchase and calculate its return deadline.",
};

export default function AddPurchasePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <div className="mb-6 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Add a purchase
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enter purchase details to see your exact return deadline and set reminders.
        </p>
      </div>

      <Card className="shadow-sm border-border bg-white p-6 sm:p-8">
        <ManualAddForm />
      </Card>
    </div>
  );
}
