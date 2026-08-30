"use client";

import * as React from "react";
import { Check, Package, Edit2, CalendarDays, Store, AlertCircle } from "lucide-react";
import { PurchaseWithStore } from "@/types/purchase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUrgency, formatDate } from "@/lib/deadlines";
import { formatCurrency } from "@/lib/utils";

interface PurchaseRowProps {
  purchase: PurchaseWithStore;
  onStatusChange: (purchaseId: string, newStatus: "active" | "returned" | "kept") => Promise<void>;
  onEdit: (purchase: PurchaseWithStore) => void;
  isLoading?: boolean;
}

export function PurchaseRow({
  purchase,
  onStatusChange,
  onEdit,
  isLoading = false,
}: PurchaseRowProps) {
  const storeName = purchase.custom_store_name || purchase.store?.name || "Unknown Store";
  const urgency = getUrgency(purchase.return_deadline, purchase.status);
  const formattedDeadline = formatDate(purchase.return_deadline);
  const formattedAmount = purchase.amount ? formatCurrency(purchase.amount, purchase.currency) : null;

  return (
    <div
      className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-card border border-border bg-white shadow-sm transition-all duration-150 hover:border-neutral-300 ${
        purchase.status !== "active" ? "opacity-75 bg-neutral-50/50" : ""
      }`}
    >
      {/* Left side: Store, Item, and Meta */}
      <div className="flex items-start gap-3.5 w-full sm:w-auto mb-3 sm:mb-0">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
            urgency.level === "overdue"
              ? "bg-red-50 border-red-200 text-semantic-error"
              : urgency.level === "today" || urgency.level === "1day" || urgency.level === "3days"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-neutral-50 border-neutral-200 text-neutral-700"
          }`}
        >
          <Store className="w-5 h-5" />
        </div>

        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-neutral-900 text-base">
              {storeName}
            </span>
            {formattedAmount && (
              <span className="text-sm font-medium text-neutral-600">
                {formattedAmount}
              </span>
            )}
            <Badge variant={urgency.level}>{urgency.label}</Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
            {purchase.item_name && (
              <span className="font-medium text-neutral-700">
                {purchase.item_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Deadline: {formattedDeadline}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
        {purchase.status === "active" ? (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onStatusChange(purchase.id, "returned")}
              disabled={isLoading}
              className="gap-1 text-xs font-semibold px-3 py-1.5 h-9"
              title="Mark item returned"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Returned</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => onStatusChange(purchase.id, "kept")}
              disabled={isLoading}
              className="gap-1 text-xs font-medium px-3 py-1.5 h-9 text-neutral-700"
              title="Keep item"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Keep</span>
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onStatusChange(purchase.id, "active")}
            disabled={isLoading}
            className="text-xs font-medium px-3 py-1.5 h-9"
          >
            Reactivate
          </Button>
        )}

        <Button
          size="sm"
          variant="tertiary"
          onClick={() => onEdit(purchase)}
          disabled={isLoading}
          className="p-2 h-9 w-9 text-neutral-500 hover:text-neutral-900"
          title="Edit details"
          aria-label="Edit purchase details"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
