"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays, AlertTriangle, Sparkles, Check } from "lucide-react";
import { ExtractedReceiptData } from "@/types/purchase";
import { calculateReturnDeadline, getTodayString, formatDate } from "@/lib/deadlines";
import { toast } from "@/lib/use-toast";

interface ReceiptReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: ExtractedReceiptData | null;
  imagePreviewUrl: string | null;
  onSaveComplete?: (purchaseId: string) => void;
}

const COMMON_WINDOWS = [14, 30, 60, 90];

export function ReceiptReviewDialog({
  isOpen,
  onClose,
  extractedData,
  imagePreviewUrl,
  onSaveComplete,
}: ReceiptReviewDialogProps) {
  const router = useRouter();

  const [storeName, setStoreName] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState("");
  const [returnWindowDays, setReturnWindowDays] = React.useState<number>(30);
  const [itemName, setItemName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (extractedData) {
      setStoreName(extractedData.storeName || "");
      setPurchaseDate(extractedData.purchaseDate || getTodayString());
      setItemName(extractedData.itemName || "");
      setAmount(extractedData.amount ? String(extractedData.amount) : "");
      setReturnWindowDays(30);
      setError(null);
    }
  }, [extractedData]);

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

  if (!extractedData) return null;

  const isLowConfidence = extractedData.confidence < 0.75;

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

    try {
      setIsLoading(true);
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customStoreName: storeName.trim(),
          purchaseDate,
          returnWindowDays,
          itemName: itemName.trim() || null,
          amount: amount.trim() ? parseFloat(amount) : null,
          currency: "USD",
          source: "receipt",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Could not save purchase.");
      }

      toast({
        title: "Purchase saved from receipt.",
        description: `Return deadline: ${liveDeadline}`,
        variant: "success",
      });

      if (onSaveComplete) {
        onSaveComplete(data.purchase.id);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save purchase.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Review Receipt Details"
      description="Extracted automatically. Check before saving."
      className="max-w-xl"
    >
      <form onSubmit={handleSave} className="space-y-4 text-left">
        {/* Transparency note banner */}
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 flex items-start gap-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 shrink-0 mt-0.5">
            <Check className="w-3 h-3" />
          </div>
          <p className="text-xs text-neutral-600">
            Please verify the extracted information below. Nothing is saved until you click <strong>Save purchase</strong>.
          </p>
        </div>

        {/* Low Confidence Warning */}
        {isLowConfidence && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 font-medium">
              Could not read everything with certainty. Please check or fill missing fields.
            </p>
          </div>
        )}

        {/* Image thumbnail preview if present */}
        {imagePreviewUrl && (
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-200 bg-neutral-50">
            <img
              src={imagePreviewUrl}
              alt="Receipt preview"
              className="h-14 w-14 object-cover rounded-md border border-neutral-300"
            />
            <div className="text-xs text-neutral-500">
              <p className="font-semibold text-neutral-800">Receipt image scanned</p>
              <p>Confidence score: {Math.round(extractedData.confidence * 100)}%</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md bg-semantic-error-subtle text-semantic-error text-sm font-medium">
            {error}
          </div>
        )}

        <Input
          label="Store Name"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="e.g. Target, Zara, Best Buy"
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

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900">
              Return Window
            </label>
            <div className="flex gap-1.5">
              {COMMON_WINDOWS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setReturnWindowDays(days)}
                  className={`px-2.5 py-2 rounded-md text-xs font-semibold border transition-colors flex-1 ${
                    returnWindowDays === days
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-neutral-700 border-border hover:bg-neutral-50"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Deadline Banner */}
        {liveDeadline && (
          <div className="p-3 rounded-md bg-primary-subtle border border-green-200 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-primary font-medium">
              <CalendarDays className="w-4 h-4" />
              <span>Return by: {liveDeadline}</span>
            </div>
            <Badge variant="verified">Calculated</Badge>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Item Name (optional)"
            placeholder="e.g. Headphones"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />

          <Input
            label="Amount Paid (USD)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Add manually
          </Button>

          <Button type="submit" size="sm" isLoading={isLoading} className="font-semibold px-6">
            Save purchase
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
