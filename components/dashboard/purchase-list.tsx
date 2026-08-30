"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, RotateCcw, AlertTriangle, CheckCircle2, ShoppingBag } from "lucide-react";
import { PurchaseWithStore } from "@/types/purchase";
import { PurchaseRow } from "@/components/purchase/purchase-row";
import { PurchaseRowSkeleton } from "@/components/ui/skeleton";
import { PurchaseEditDrawer } from "@/components/purchase/purchase-edit-drawer";
import { EmptyPurchases } from "@/components/dashboard/empty-purchases";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/use-toast";
import { getUrgency } from "@/lib/deadlines";
import { formatCurrency } from "@/lib/utils";

export function PurchaseList() {
  const [purchases, setPurchases] = React.useState<PurchaseWithStore[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"active" | "completed">("active");
  const [editingPurchase, setEditingPurchase] = React.useState<PurchaseWithStore | null>(null);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const fetchPurchases = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/purchases");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Could not load purchases.");
      }

      setPurchases(data.purchases || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not load purchases. Try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Handle status update with optimistic UI and 10-second undo
  const handleStatusChange = async (
    purchaseId: string,
    newStatus: "active" | "returned" | "kept"
  ) => {
    const target = purchases.find((p) => p.id === purchaseId);
    if (!target) return;

    const previousStatus = target.status;

    // Optimistic UI update
    setPurchases((prev) =>
      prev.map((p) => (p.id === purchaseId ? { ...p, status: newStatus } : p))
    );

    try {
      setActionLoadingId(purchaseId);
      const res = await fetch(`/api/purchases/${purchaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Status update failed.");

      const actionTitle =
        newStatus === "returned"
          ? "Marked as returned."
          : newStatus === "kept"
          ? "Kept item saved."
          : "Purchase restored to active.";

      toast({
        title: actionTitle,
        description:
          newStatus === "returned" && target.amount
            ? `Recovered ${formatCurrency(target.amount, target.currency)}.`
            : undefined,
        variant: "success",
        action: {
          label: "Undo",
          onClick: async () => {
            // Revert status
            setPurchases((prev) =>
              prev.map((p) =>
                p.id === purchaseId ? { ...p, status: previousStatus } : p
              )
            );
            await fetch(`/api/purchases/${purchaseId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: previousStatus }),
            });
            toast({
              title: "Action undone.",
              variant: "default",
            });
          },
        },
        duration: 10000,
      });
    } catch {
      // Revert optimistic update on failure
      setPurchases((prev) =>
        prev.map((p) =>
          p.id === purchaseId ? { ...p, status: previousStatus } : p
        )
      );
      toast({
        title: "Could not update status",
        description: "Please check your connection and try again.",
        variant: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdatedPurchase = (updated: PurchaseWithStore) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleDeletedPurchase = (deletedId: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== deletedId));
  };

  // Filter and sort purchases by urgency
  const activePurchases = React.useMemo(() => {
    return purchases
      .filter((p) => p.status === "active")
      .sort((a, b) => {
        const urgA = getUrgency(a.return_deadline, a.status);
        const urgB = getUrgency(b.return_deadline, b.status);
        // Overdue first (negative daysRemaining)
        return urgA.daysRemaining - urgB.daysRemaining;
      });
  }, [purchases]);

  const completedPurchases = React.useMemo(() => {
    return purchases.filter((p) => p.status !== "active");
  }, [purchases]);

  const displayedPurchases =
    activeTab === "active" ? activePurchases : completedPurchases;

  return (
    <div className="space-y-6 text-left">
      {/* Tab Filter Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              activeTab === "active"
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            Active ({activePurchases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              activeTab === "completed"
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            Completed ({completedPurchases.length})
          </button>
        </div>

        <Link href="/add">
          <Button size="sm" className="gap-1.5 font-medium shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add purchase</span>
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          <PurchaseRowSkeleton />
          <PurchaseRowSkeleton />
          <PurchaseRowSkeleton />
        </div>
      )}

      {/* Error State with Actionable Retry */}
      {!isLoading && error && (
        <div className="rounded-card border border-red-200 bg-semantic-error-subtle p-6 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-semantic-error">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-neutral-900">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchPurchases}
            className="gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && displayedPurchases.length === 0 && (
        <>
          {activeTab === "active" ? (
            <EmptyPurchases />
          ) : (
            <div className="text-center py-12 p-6 rounded-card border border-dashed border-border bg-white text-neutral-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
              <p className="text-sm font-medium">No returned or kept items yet.</p>
            </div>
          )}
        </>
      )}

      {/* Purchase Rows */}
      {!isLoading && !error && displayedPurchases.length > 0 && (
        <div className="space-y-3">
          {displayedPurchases.map((purchase) => (
            <PurchaseRow
              key={purchase.id}
              purchase={purchase}
              onStatusChange={handleStatusChange}
              onEdit={setEditingPurchase}
              isLoading={actionLoadingId === purchase.id}
            />
          ))}
        </div>
      )}

      {/* Edit Drawer Modal */}
      <PurchaseEditDrawer
        purchase={editingPurchase}
        isOpen={!!editingPurchase}
        onClose={() => setEditingPurchase(null)}
        onUpdated={handleUpdatedPurchase}
        onDeleted={handleDeletedPurchase}
      />
    </div>
  );
}
