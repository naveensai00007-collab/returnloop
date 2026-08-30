"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error securely
    console.error("Application error:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-semantic-error-subtle text-semantic-error mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-2">
        Something went wrong
      </h1>
      <p className="text-neutral-600 max-w-md text-base mb-6">
        Could not complete this action. Check your connection or try again.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => reset()} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try again
        </Button>
        <Link href="/dashboard">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
