import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-200/70",
        className
      )}
      {...props}
    />
  );
}

export function PurchaseRowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-card border border-border bg-white shadow-sm space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <Skeleton className="h-10 w-10 rounded-md shrink-0" />
        <div className="space-y-2 w-full sm:w-48">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3.5 w-40" />
        </div>
      </div>
      <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
        <div className="space-y-1 text-right">
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-3.5 w-16 ml-auto" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-24 rounded-button" />
          <Skeleton className="h-9 w-16 rounded-button" />
        </div>
      </div>
    </div>
  );
}
