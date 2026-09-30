import { cn } from "@/lib/utils";
import type { EnquiryStatus, Priority } from "@/lib/data/types";

const statusStyles: Record<string, string> = {
  New: "bg-info/12 text-info border-info/25",
  Interested: "bg-info/12 text-info border-info/25",
  "Follow-up Required": "bg-warning/15 text-warning-foreground border-warning/35",
  "Follow-up": "bg-warning/15 text-warning-foreground border-warning/35",
  Pending: "bg-warning/12 text-warning-foreground border-warning/30",
  Escalated: "bg-destructive/12 text-destructive border-destructive/30",
  Closed: "bg-muted text-muted-foreground border-border",
  Converted: "bg-success/14 text-success border-success/30",
  Booked: "bg-success/14 text-success border-success/30",
  Confirmed: "bg-success/14 text-success border-success/30",
  "Not Converted": "bg-muted text-muted-foreground border-border",
  "Not captured": "bg-muted text-muted-foreground border-border",
  Unknown: "bg-muted text-muted-foreground border-border",
  Returning: "bg-primary/10 text-primary border-primary/25",
};

export function StatusBadge({
  status,
  className,
}: {
  status: EnquiryStatus | string;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status] ?? "bg-secondary text-secondary-foreground border-border",
        className,
      )}
    >
      {status}
    </span>
  );
}

const priorityStyles: Record<Priority, string> = {
  High: "bg-destructive/12 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning-foreground border-warning/35",
  Low: "bg-muted text-muted-foreground border-border",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        priorityStyles[priority],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}
