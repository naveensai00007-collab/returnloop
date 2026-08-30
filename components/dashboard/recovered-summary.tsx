"use client";

import * as React from "react";
import { DollarSign, PackageCheck, Clock } from "lucide-react";
import { PurchaseWithStore } from "@/types/purchase";
import { formatCurrency } from "@/lib/utils";

interface RecoveredSummaryProps {
  purchases: PurchaseWithStore[];
}

export function RecoveredSummary({ purchases }: RecoveredSummaryProps) {
  const { totalRecovered, returnedCount, activeCount } = React.useMemo(() => {
    let total = 0;
    let returned = 0;
    let active = 0;

    purchases.forEach((p) => {
      if (p.status === "returned") {
        returned++;
        if (p.amount && !isNaN(p.amount)) {
          total += Number(p.amount);
        }
      } else if (p.status === "active") {
        active++;
      }
    });

    return {
      totalRecovered: total,
      returnedCount: returned,
      activeCount: active,
    };
  }, [purchases]);

  if (purchases.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {/* Total Recovered Card */}
      <div className="rounded-card border border-green-200 bg-primary-subtle p-4 text-left shadow-sm">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
          <DollarSign className="w-4 h-4" />
          <span>Money Recovered</span>
        </div>
        <p className="text-2xl font-bold text-neutral-900">
          {formatCurrency(totalRecovered)}
        </p>
        <p className="text-xs text-neutral-600 mt-0.5">
          From {returnedCount} item{returnedCount === 1 ? "" : "s"} marked returned
        </p>
      </div>

      {/* Active Purchases */}
      <div className="rounded-card border border-border bg-white p-4 text-left shadow-sm">
        <div className="flex items-center gap-2 text-neutral-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4 text-neutral-500" />
          <span>Active Tracking</span>
        </div>
        <p className="text-2xl font-bold text-neutral-900">{activeCount}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Purchase{activeCount === 1 ? "" : "s"} with active return windows
        </p>
      </div>

      {/* Returned / Kept Completed */}
      <div className="rounded-card border border-border bg-white p-4 text-left shadow-sm">
        <div className="flex items-center gap-2 text-neutral-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <PackageCheck className="w-4 h-4 text-neutral-500" />
          <span>Resolved Orders</span>
        </div>
        <p className="text-2xl font-bold text-neutral-900">
          {purchases.length - activeCount}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Marked as returned or kept
        </p>
      </div>
    </div>
  );
}
