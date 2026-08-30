"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trash2, CalendarDays } from "lucide-react";
import { PurchaseWithStore } from "@/types/purchase";
import { calculateReturnDeadline, formatDate, getTodayString } from "@/lib/deadlines";
import { toast } from "@/lib/use-toast";

interface PurchaseEditDrawerProps {
  purchase: PurchaseWithStore | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedPurchase: PurchaseWithStore) => void;
  onDeleted: (purchaseId: string) => void;
}

export function PurchaseEditDrawer({
  purchase,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: PurchaseEditDrawerProps) {
  const [storeName, setStoreName] = React.useState("");
  const [itemName, setItemName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState("");
  const [returnWindowDays, setReturnWindowDays] = React.useState<number>(30);
  const [status, setStatus] = React.useState<"active" | "returned" | "kept">("active");
  const [notes, setNotes] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (purchase) {
      setStoreName(purchase.custom_store_name || purchase.store?.name || "");
      setItemName(purchase.item_name || "");
      setAmount(purchase.amount ? String(purchase.amount) : "");
      setPurchaseDate(purchase.purchase_date);
      setReturnWindowDays(purchase.return_window_days);
      setStatus(purchase.status);
      setNotes(purchase.notes || "");
      setError(null);
    }
  }, [purchase]);

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

  if (!purchase) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!storeName.trim()) {
      setError("Store name is required.");
      return;
    }

    if (!purchaseDate) {
      setError("Purchase date is required.");
      return;
    }

    if (returnWindowDays < 1 || returnWindowDays > 365) {
      setError("Return window must be between 1 and 365 days.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/purchases/${purchase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customStoreName: storeName.trim(),
          itemName: itemName.trim() || null,
          amount: amount.trim() ? parseFloat(amount) : null,
          purchaseDate,
          returnWindowDays,
          status,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update purchase.");

      toast({
        title: "Changes saved.",
        variant: "success",
      });

      onUpdated(data.purchase);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save changes.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/purchases/${purchase.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete purchase.");

      toast({
        title: "Purchase deleted.",
        action: {
          label: "Undo",
          onClick: async () => {
            await fetch(`/api/purchases/${purchase.id}/restore`, {
              method: "POST",
            });
            onUpdated(purchase);
          },
        },
        duration: 10000,
      });

      onDeleted(purchase.id);
      onClose();
    } catch {
      toast({
        title: "Could not delete purchase",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Purchase"
      description="Update purchase details or change status."
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-semantic-error-subtle text-semantic-error text-sm">
            {error}
          </div>
        )}

        <Input
          label="Store Name"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Purchase Date"
            type="date"
            max={getTodayString()}
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />

          <Input
            label="Return Window (Days)"
            type="number"
            min={1}
            max={365}
            value={returnWindowDays}
            onChange={(e) => setReturnWindowDays(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>

        {liveDeadline && (
          <div className="p-3 rounded-md bg-primary-subtle border border-green-200 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-primary font-medium">
              <CalendarDays className="w-4 h-4" />
              <span>Return by: {liveDeadline}</span>
            </div>
            <Badge variant="verified">Live</Badge>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Item Name"
            placeholder="e.g. Jacket"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />

          <Input
            label="Amount (USD)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-sm font-medium text-neutral-900">
            Status
          </label>
          <div className="flex gap-2">
            {(["active", "returned", "kept"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize border transition-colors ${
                  status === s
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-neutral-700 border-border hover:bg-neutral-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isLoading || isDeleting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
