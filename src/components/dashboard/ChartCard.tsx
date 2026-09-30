import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  bodyClassName?: string | undefined;
}) {
  return (
    <section className={cn("surface-card flex flex-col", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />;
}

export function EmptyState({
  message = "No enquiry data available for the selected period.",
  height,
}: {
  message?: string | undefined;
  height?: number | undefined;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center"
      style={height ? { minHeight: height } : undefined}
    >
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">Try widening the date range or clearing filters.</p>
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
