"use client";

import * as React from "react";
import { useToast } from "@/lib/use-toast";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex max-w-md w-full flex-col gap-2 pointer-events-none p-4"
    >
      {toasts.map((t) => {
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start justify-between gap-3 rounded-button border p-4 shadow-md transition-all duration-200 animate-in slide-in-from-bottom-5",
              t.variant === "success" &&
                "bg-white border-green-200 text-neutral-900",
              t.variant === "error" &&
                "bg-white border-red-200 text-neutral-900",
              (!t.variant || t.variant === "default") &&
                "bg-neutral-900 border-neutral-800 text-white"
            )}
          >
            <div className="flex items-start gap-3">
              {t.variant === "success" && (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              )}
              {t.variant === "error" && (
                <AlertCircle className="w-5 h-5 text-semantic-error shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                {t.title && (
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      t.variant === "default" ? "text-white" : "text-neutral-900"
                    )}
                  >
                    {t.title}
                  </p>
                )}
                {t.description && (
                  <p
                    className={cn(
                      "text-sm",
                      t.variant === "default"
                        ? "text-neutral-300"
                        : "text-neutral-600"
                    )}
                  >
                    {t.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
                    t.variant === "default"
                      ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300"
                  )}
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className={cn(
                  "rounded p-1 transition-colors",
                  t.variant === "default"
                    ? "text-neutral-400 hover:text-white"
                    : "text-neutral-500 hover:text-neutral-900"
                )}
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
