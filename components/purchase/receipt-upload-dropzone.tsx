"use client";

import * as React from "react";
import { Upload, FileText, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExtractedReceiptData } from "@/types/purchase";
import { ReceiptReviewDialog } from "./receipt-review-dialog";

interface ReceiptUploadDropzoneProps {
  onManualSwitch?: (prefilled?: Partial<ExtractedReceiptData>) => void;
}

export function ReceiptUploadDropzone({ onManualSwitch }: ReceiptUploadDropzoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [extractedData, setExtractedData] = React.useState<ExtractedReceiptData | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);

  const processFile = async (file: File) => {
    setError(null);

    // 1. Client-side MIME type check
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Use a JPEG, PNG, or WEBP image under 4 MB.");
      return;
    }

    // 2. Client-side file size check (4MB)
    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be under 4 MB.");
      return;
    }

    try {
      setIsLoading(true);

      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read image file."));
      });
      reader.readAsDataURL(file);
      const dataUrl = await base64Promise;

      setPreviewUrl(dataUrl);

      // Call API extraction
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: file.type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Could not extract receipt details.");
      }

      setExtractedData(data.extraction);
      setIsReviewOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not read this receipt. You can add the purchase manually.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-8 sm:p-12 rounded-card border-2 border-dashed transition-all cursor-pointer text-center ${
          isDragging
            ? "border-primary bg-primary-subtle"
            : "border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50/50"
        } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-neutral-900">
                Reading receipt...
              </p>
              <p className="text-xs text-neutral-500">
                Extracting store name, purchase date, and amount.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 mb-3">
              <Upload className="w-6 h-6" />
            </div>

            <p className="text-base font-semibold text-neutral-900 mb-1">
              Upload receipt or order screenshot
            </p>
            <p className="text-xs text-neutral-500 max-w-xs mb-4">
              Drag and drop your receipt image here, or click to browse. Supports JPEG, PNG, or WEBP under 4 MB.
            </p>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="pointer-events-none gap-1.5"
            >
              <ImageIcon className="w-4 h-4" />
              Choose file
            </Button>
          </>
        )}
      </div>

      {/* Error Message with Manual Form Fallback */}
      {error && (
        <div className="p-4 rounded-lg bg-semantic-error-subtle border border-red-200 text-left space-y-2">
          <div className="flex items-start gap-2 text-semantic-error text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          {onManualSwitch && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onManualSwitch()}
              className="text-xs"
            >
              Enter purchase details manually
            </Button>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <ReceiptReviewDialog
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        extractedData={extractedData}
        imagePreviewUrl={previewUrl}
      />
    </div>
  );
}
