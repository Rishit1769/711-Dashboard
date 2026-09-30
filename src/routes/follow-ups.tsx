import { createFileRoute } from "@tanstack/react-router";
import { AlarmClock, CalendarClock, ShieldAlert, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { EmptyState } from "@/components/dashboard/ChartCard";
import { EnquiryDetailSheet } from "@/components/dashboard/details";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState, LoadingState, PageHeader } from "@/components/dashboard/PageState";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REFERENCE_NOW } from "@/lib/data/dataset";
import { dateOnly, dateTime, fmtInt } from "@/lib/data/analytics";
import { useAnalytics } from "@/lib/data/filters";
import { ENQUIRY_TYPES, type Enquiry, type Priority } from "@/lib/data/types";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-up Queue — 711 Club Admin" },
      {
        name: "description",
        content:
          "Priority follow-up queue for 711 Club: who to call back, what they asked about, when it is due and who owns it.",
      },
      { property: "og:title", content: "Follow-up Queue — 711 Club" },
      {
        property: "og:description",
        content: "Overdue and upcoming follow-ups by priority, type, status and assigned team member.",
      },
    ],
  }),
  component: FollowUpsPage,
});

function FollowUpsPage() {
  const { scope, isLoading, isError, refetch } = useAnalytics();
  const [type, setType] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [assignee, setAssignee] = useState<string>("all");
  const [due, setDue] = useState<string>("all");
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const data = useMemo(() => {
    if (!scope) return null;
    const all = scope.enquiries.filter((e) => e.followUpRequired);
    const now = REFERENCE_NOW.getTime();
    const rows = all
      .filter((e) => (type === "all" ? true : e.type === type))
      .filter((e) => (priority === "all" ? true : e.priority === priority))
      .filter((e) => (assignee === "all" ? true : e.assignedTo === assignee))
      .filter((e) => {
        if (due === "all") return true;
        const t = e.followUpDueAt ? new Date(e.followUpDueAt).getTime() : null;
        if (t === null) return due === "unscheduled";
        if (due === "overdue") return t < now;
        if (due === "upcoming") return t >= now;
        return true;
      })
      .sort((a, b) => (a.followUpDueAt ?? "").localeCompare(b.followUpDueAt ?? ""));
    return {
      all,
      rows,
      overdue: all.filter((e) => e.followUpDueAt && new Date(e.followUpDueAt).getTime() < now).length,
      high: all.filter((e) => e.priority === "High").length,
      escalated: scope.enquiries.filter((e) => e.status === "Escalated").length,
    };
  }, [scope, type, priority, assignee, due]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !scope || !data) return <LoadingState kpis={4} />;

  const nameOf = (e: Enquiry) =>
    scope.customers.find((c) => c.id === e.customerId)?.name ?? "Unknown";

  const exportQueue = () =>
    downloadCsv(
      "711club-follow-up-queue",
      ["Customer", "Type", "Last message", "Last interaction", "Follow-up due", "Assigned", "Status", "Priority"],
      data.rows.map((e) => [
        nameOf(e),
        e.type,
        e.lastMessage,
        dateTime(e.lastInteractionAt),
        dateOnly(e.followUpDueAt),
        e.assignedTo,
        e.status,
        e.priority,
      ]),
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Follow-up Queue"
        description="Everything waiting on the team, ordered by when it is due."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Follow-ups required" value={fmtInt(data.all.length)} icon={CalendarClock} />
        <KpiCard label="Overdue" value={fmtInt(data.overdue)} icon={AlarmClock} tone="danger" />
        <KpiCard label="High priority" value={fmtInt(data.high)} icon={TrendingUp} tone="warning" />
        <KpiCard label="Escalated conversations" value={fmtInt(data.escalated)} icon={ShieldAlert} tone="danger" />
      </section>

      <ChartCard
        title="Follow-up Required"
        description={`${data.rows.length} of ${data.all.length} items match the current queue filters`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {ENQUIRY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {(["High", "Medium", "Low"] as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                {scope.staff.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={due} onValueChange={setDue}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Due" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any due date</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="unscheduled">Unscheduled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportQueue}>
              Export queue
            </Button>
          </div>
        }
      >
        {data.rows.length === 0 ? (
          <EmptyState message="No follow-ups match these filters for the selected period." />
        ) : (
          <ul className="grid gap-3 xl:grid-cols-2">
            {data.rows.map((e) => {
              const overdue =
                e.followUpDueAt && new Date(e.followUpDueAt).getTime() < REFERENCE_NOW.getTime();
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(e)}
                    className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{nameOf(e)}</span>
                      <StatusBadge status={e.type} />
                      <span className="ml-auto flex items-center gap-2">
                        <PriorityBadge priority={e.priority} />
                        <StatusBadge status={e.status} />
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">“{e.lastMessage}”</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="text-muted-foreground">Last interaction</dt>
                        <dd className="font-medium">{dateTime(e.lastInteractionAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Follow-up due</dt>
                        <dd className={overdue ? "font-semibold text-destructive" : "font-medium"}>
                          {dateOnly(e.followUpDueAt)}
                          {overdue ? " · overdue" : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Assigned to</dt>
                        <dd className="font-medium">{e.assignedTo}</dd>
                      </div>
                    </dl>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ChartCard>

      <EnquiryDetailSheet
        enquiry={selected}
        scope={scope}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
