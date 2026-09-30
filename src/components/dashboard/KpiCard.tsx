import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon | undefined;
  change?: number | null | undefined;
  changeLabel?: string | undefined;
  hint?: string | undefined;
  tone?: "default" | "success" | "warning" | "danger" | undefined;
  invertChange?: boolean | undefined;
  onClick?: (() => void) | undefined;
  active?: boolean | undefined;
}

const toneRing: Record<string, string> = {
  default: "text-primary bg-primary/10",
  success: "text-success bg-success/12",
  warning: "text-warning-foreground bg-warning/18",
  danger: "text-destructive bg-destructive/12",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  change,
  changeLabel = "vs previous period",
  hint,
  tone = "default",
  invertChange = false,
  onClick,
  active,
}: KpiCardProps) {
  const good = change === null || change === undefined ? null : invertChange ? change <= 0 : change >= 0;
  const Arrow = change === null || change === undefined ? Minus : change >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "surface-card group flex w-full flex-col gap-3 p-5 text-left transition-all",
        onClick && "hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]",
        active && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        !onClick && "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon ? (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", toneRing[tone])}>
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="metric-value text-3xl leading-none">{value}</div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {change !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-semibold",
              good === null ? "text-muted-foreground" : good ? "text-success" : "text-destructive",
            )}
          >
            <Arrow className="size-3.5" />
            {change === null ? "N/A" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
          </span>
        ) : null}
        <span className="text-muted-foreground">{change !== undefined ? changeLabel : hint}</span>
      </div>
    </button>
  );
}

export function KpiSkeleton() {
  return (
    <div className="surface-card flex flex-col gap-4 p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
