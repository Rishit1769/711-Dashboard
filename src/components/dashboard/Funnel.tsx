import { cn } from "@/lib/utils";

export interface FunnelStage {
  name: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger" | "muted" | undefined;
}

const toneBar: Record<string, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  muted: "bg-muted-foreground/50",
};

export function Funnel({
  stages,
  onSelect,
  activeName,
}: {
  stages: FunnelStage[];
  onSelect?: ((name: string) => void) | undefined;
  activeName?: string | null | undefined;
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  const total = stages.reduce((s, x) => s + x.value, 0);

  return (
    <ol className="flex flex-col gap-3">
      {stages.map((stage) => (
        <li key={stage.name}>
          <button
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(stage.name)}
            className={cn(
              "w-full rounded-lg p-2 text-left transition-colors",
              onSelect && "hover:bg-secondary/70",
              activeName === stage.name && "bg-secondary",
            )}
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{stage.name}</span>
              <span className="text-muted-foreground">
                <span className="metric-value mr-2 text-base text-foreground">{stage.value}</span>
                {total ? `${((stage.value / total) * 100).toFixed(1)}%` : "0%"}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", toneBar[stage.tone ?? "default"])}
                style={{ width: `${(stage.value / max) * 100}%` }}
              />
            </div>
          </button>
        </li>
      ))}
    </ol>
  );
}
