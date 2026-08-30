"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Store, Tag, DollarSign, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "@/lib/use-toast";
import {
  calculateReturnDeadline,
  getTodayString,
  formatDate,
} from "@/lib/deadlines";
import { PurchaseCreateSchema } from "@/lib/validation";

interface StoreOption {
  id: string;
  name: string;
  defaultReturnWindowDays: number;
  policyNotes?: string | null;
}

const POPULAR_STORES: StoreOption[] = [
  { id: "10000000-0000-0000-0000-000000000001", name: "Amazon", defaultReturnWindowDays: 30 },
  { id: "10000000-0000-0000-0000-000000000002", name: "Target", defaultReturnWindowDays: 90 },
  { id: "10000000-0000-0000-0000-000000000003", name: "Walmart", defaultReturnWindowDays: 90 },
  { id: "10000000-0000-0000-0000-000000000004", name: "Best Buy", defaultReturnWindowDays: 15 },
  { id: "10000000-0000-0000-0000-000000000005", name: "Apple", defaultReturnWindowDays: 14 },
  { id: "10000000-0000-0000-0000-000000000006", name: "Zara", defaultReturnWindowDays: 30 },
  { id: "10000000-0000-0000-0000-000000000007", name: "Nike", defaultReturnWindowDays: 30 },
];

const COMMON_WINDOWS = [14, 30, 60, 90];

export function ManualAddForm({
  onSuccess,
  initialValues,
}: {
  onSuccess?: (purchaseId: string) => void;
  initialValues?: {
    storeName?: string;
    purchaseDate?: string;
    itemName?: string;
    amount?: number;
    returnWindowDays?: number;
  };
}) {
  const router = useRouter();

  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
  const [storeQuery, setStoreQuery] = React.useState(initialValues?.storeName || "");
  const [isCustomStore, setIsCustomStore] = React.useState(false);
  const [purchaseDate, setPurchaseDate] = React.useState(
    initialValues?.purchaseDate || getTodayString()
  );
  const [returnWindowDays, setReturnWindowDays] = React.useState<number>(
    initialValues?.returnWindowDays || 30
  );
  const [isCustomWindow, setIsCustomWindow] = React.useState(false);
  const [itemName, setItemName] = React.useState(initialValues?.itemName || "");
  const [amount, setAmount] = React.useState<string>(
    initialValues?.amount ? String(initialValues.amount) : ""
  );

  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Compute live deadline preview
  const liveDeadline = React.useMemo(() => {
    try {
      if (purchaseDate && returnWindowDays > 0) {
        const deadline = calculateReturnDeadline(purchaseDate, returnWindowDays);
        return formatDate(deadline);
      }
    } catch {
      return null;
    }
    return null;
  }, [purchaseDate, returnWindowDays]);

  const handleSelectStore = (store: StoreOption) => {
    setSelectedStoreId(store.id);
    setStoreQuery(store.name);
    setIsCustomStore(false);
    setReturnWindowDays(store.defaultReturnWindowDays);
    setIsCustomWindow(false);
    if (errors.store) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.store;
        delete next.customStoreName;
        return next;
      });
    }
  };

  const handleSelectOtherStore = () => {
    setSelectedStoreId(null);
    setIsCustomStore(true);
    setStoreQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const amountNum = amount.trim() ? parseFloat(amount) : null;
    const storeIdToSend = selectedStoreId;
    const customStoreNameToSend = isCustomStore ? storeQuery.trim() : !selectedStoreId ? storeQuery.trim() : null;

    const payload = {
      storeId: storeIdToSend,
      customStoreName: customStoreNameToSend,
      itemName: itemName.trim() || null,
      amount: amountNum,
      currency: "USD",
      purchaseDate,
      returnWindowDays,
      source: "manual" as const,
    };

    const validation = PurchaseCreateSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      if (fieldErrors.customStoreName) {
        fieldErrors.store = fieldErrors.customStoreName;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Could not save purchase.");
      }

      toast({
        title: "Purchase saved.",
        description: `Return deadline: ${liveDeadline}`,
        variant: "success",
      });

      if (onSuccess) {
        onSuccess(data.purchase.id);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save purchase. Try again.";
      toast({
        title: "Could not save purchase",
        description: msg,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Store Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-900">
          Store <span className="text-semantic-error">*</span>
        </label>

        {/* Store Chips for recognition-first selection */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {POPULAR_STORES.map((s) => {
            const isSelected = selectedStoreId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectStore(s)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-neutral-700 border-border hover:bg-neutral-50"
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                {s.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleSelectOtherStore}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              isCustomStore
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-neutral-700 border-border hover:bg-neutral-50"
            }`}
          >
            {isCustomStore && <Check className="w-3.5 h-3.5" />}
            Other store
          </button>
        </div>

        {/* Custom store input */}
        {(isCustomStore || !selectedStoreId) && (
          <div className="pt-1">
            <Input
              placeholder="Enter store name (e.g. Nordstrom, Local Boutique)"
              value={storeQuery}
              onChange={(e) => {
                setStoreQuery(e.target.value);
                if (errors.store) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.store;
                    return next;
                  });
                }
              }}
              error={errors.store}
              autoFocus={isCustomStore}
            />
          </div>
        )}
      </div>

      {/* Purchase Date */}
      <div className="space-y-1.5">
        <label
          htmlFor="purchase-date-input"
          className="block text-sm font-medium text-neutral-900"
        >
          Purchase Date <span className="text-semantic-error">*</span>
        </label>
        <div className="relative">
          <Input
            id="purchase-date-input"
            type="date"
            max={getTodayString()}
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            error={errors.purchaseDate}
            required
          />
        </div>
      </div>

      {/* Return Window */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-neutral-900">
            Return Window <span className="text-semantic-error">*</span>
          </label>
          {selectedStoreId && (
            <Badge variant="estimate">Store policy estimate</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {COMMON_WINDOWS.map((days) => {
            const isSelected = !isCustomWindow && returnWindowDays === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => {
                  setReturnWindowDays(days);
                  setIsCustomWindow(false);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-neutral-700 border-border hover:bg-neutral-50"
                }`}
              >
                {days} days
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsCustomWindow(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
              isCustomWindow
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-neutral-700 border-border hover:bg-neutral-50"
            }`}
          >
            Custom
          </button>
        </div>

        {isCustomWindow && (
          <div className="pt-1 flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={365}
              placeholder="Number of days"
              value={returnWindowDays || ""}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setReturnWindowDays(isNaN(val) ? 0 : val);
              }}
              error={errors.returnWindowDays}
            />
            <span className="text-sm text-neutral-500 shrink-0">days</span>
          </div>
        )}
      </div>

      {/* Live Deadline Preview Box */}
      {liveDeadline && (
        <Card className="bg-primary-subtle border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-600">
                  Calculated Return Deadline
                </p>
                <p className="text-base font-bold text-primary">
                  {liveDeadline}
                </p>
              </div>
            </div>
            <Badge variant="verified">Live calculation</Badge>
          </div>
        </Card>
      )}

      {/* Optional Details (Item Name & Amount) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
        <Input
          label="Item Name (optional)"
          placeholder="e.g. Winter Jacket, Noise-canceling headphones"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          error={errors.itemName}
        />

        <Input
          label="Amount (optional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          helperText="USD currency default"
        />
      </div>

      {/* Action Button */}
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full text-base font-semibold shadow-sm h-12"
          isLoading={isLoading}
        >
          Save purchase
        </Button>
      </div>
    </form>
  );
}
