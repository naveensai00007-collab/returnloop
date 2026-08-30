import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyPurchases() {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-card border border-dashed border-neutral-300 bg-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 mb-4">
        <ShoppingBag className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
        No purchases tracked yet
      </h3>
      <p className="text-sm text-neutral-500 max-w-sm mb-6">
        Add a purchase you might return. ReturnLoop will track your deadline and remind you before the window closes.
      </p>
      <Link href="/add">
        <Button className="gap-2 font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          Add purchase
        </Button>
      </Link>
    </div>
  );
}
