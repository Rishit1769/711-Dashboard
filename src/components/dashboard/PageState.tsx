import { AlertTriangle, RefreshCw } from "lucide-react";

import { KpiSkeleton } from "./KpiCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ kpis = 8 }: { kpis?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: kpis }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-destructive/12 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <h2 className="text-base font-semibold">Unable to load analytics. Please try again.</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        The analytics service did not respond. No numbers are shown so nothing is misread.
      </p>
      <Button onClick={onRetry} className="mt-1">
        <RefreshCw className="size-4" /> Retry
      </Button>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
