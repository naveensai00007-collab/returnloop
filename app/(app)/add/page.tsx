"use client";

import * as React from "react";
import { Edit3, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ManualAddForm } from "@/components/purchase/manual-add-form";
import { ReceiptUploadDropzone } from "@/components/purchase/receipt-upload-dropzone";
import { ExtractedReceiptData } from "@/types/purchase";

export default function AddPurchasePage() {
  const [tab, setTab] = React.useState<"manual" | "upload">("manual");
  const [prefilledData, setPrefilledData] = React.useState<{
    storeName?: string | null;
    purchaseDate?: string | null;
    itemName?: string | null;
    amount?: number | null;
    returnWindowDays?: number | null;
  }>({});

  const handleManualSwitch = (prefilled?: Partial<ExtractedReceiptData>) => {
    if (prefilled) {
      setPrefilledData({
        storeName: prefilled.storeName,
        purchaseDate: prefilled.purchaseDate,
        itemName: prefilled.itemName,
        amount: prefilled.amount,
      });
    }
    setTab("manual");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <div className="mb-6 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Add a purchase
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enter purchase details or scan a receipt to see your exact return deadline.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            tab === "manual"
              ? "bg-primary text-white shadow-sm"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Manual entry</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            tab === "upload"
              ? "bg-primary text-white shadow-sm"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload receipt</span>
        </button>
      </div>

      {/* Main Content Area */}
      <Card className="shadow-sm border-border bg-white p-6 sm:p-8">
        {tab === "manual" ? (
          <ManualAddForm
            initialValues={{
              storeName: prefilledData.storeName || undefined,
              purchaseDate: prefilledData.purchaseDate || undefined,
              itemName: prefilledData.itemName || undefined,
              amount: prefilledData.amount || undefined,
              returnWindowDays: prefilledData.returnWindowDays || undefined,
            }}
          />
        ) : (
          <ReceiptUploadDropzone onManualSwitch={handleManualSwitch} />
        )}
      </Card>
    </div>
  );
}
