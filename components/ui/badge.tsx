import * as React from "react";
import { cn } from "@/lib/utils";
import { UrgencyLevel } from "@/types/purchase";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: UrgencyLevel | "default" | "estimate" | "verified";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-neutral-100 text-neutral-800 border-neutral-200",
    overdue: "bg-semantic-error-subtle text-semantic-error border-red-200 font-semibold",
    today: "bg-amber-100 text-amber-900 border-amber-300 font-semibold",
    "1day": "bg-amber-50 text-amber-800 border-amber-200 font-medium",
    "3days": "bg-yellow-50 text-yellow-800 border-yellow-200 font-medium",
    "7days": "bg-neutral-100 text-neutral-700 border-neutral-200",
    future: "bg-neutral-100 text-neutral-700 border-neutral-200",
    completed: "bg-primary-subtle text-primary border-green-200 font-medium",
    estimate: "bg-neutral-100 text-neutral-600 border-dashed border-neutral-300 text-xs",
    verified: "bg-primary-subtle text-primary border-green-200 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
