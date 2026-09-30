import { createFileRoute } from "@tanstack/react-router";
import { Bot, Headset, MessageSquare, Repeat2, ShieldAlert, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { TrendChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { EnquiryDetailSheet } from "@/components/dashboard/details";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState, LoadingState, PageHeader } from "@/components/dashboard/PageState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  dateTime,
  engagementMetrics,
  engagementSeries,
  fmtInt,
  fmtPct,
} from "@/lib/data/analytics";
import { useAnalytics } from "@/lib/data/filters";
import type { Enquiry } from "@/lib/data/types";

export const Route = createFileRoute("/conversations")({
  head: () => ({
    meta: [
      { title: "WhatsApp Engagement — 711 Club Admin" },
      {
        name: "description",
        content:
          "WhatsApp conversation volumes, AI versus human handling, escalations, delivery failures and response rates for 711 Club.",
      },
      { property: "og:title", content: "WhatsApp Engagement — 711 Club" },
      {
        property: "og:description",
        content: "Conversation volume, AI and human handling, escalations and delivery health.",
      },
    ],
  }),
  component: ConversationsPage,
});

const SERIES = {
  customer: { key: "customer", label: "Customer Messages", color: "var(--color-chart-1)" },
  ai: { key: "ai", label: "AI Responses", color: "var(--color-chart-2)" },
  human: { key: "human", label: "Human Responses", color: "var(--color-chart-3)" },
  total: { key: "total", label: "Total Interactions", color: "var(--color-chart-4)" },
  escalations: { key: "escalations", label: "Escalations", color: "var(--color-chart-5)" },
} as const;
type SeriesKey = keyof typeof SERIES;

function RateRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="metric-value">{fmtPct(value)}</span>
      </div>
      <Progress value={value ?? 0} className="mt-2 h-2" />
    </div>
  );
}

function ConversationsPage() {
  const { scope, isLoading, isError, refetch } = useAnalytics();
  const [keys, setKeys] = useState<SeriesKey[]>(["customer", "ai", "human"]);
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const data = useMemo(() => {
    if (!scope) return null;
    const eng = engagementMetrics(scope);
    const rows = [...scope.enquiries].sort((a, b) =>
      b.lastInteractionAt.localeCompare(a.lastInteractionAt),
    );
    const counts = (id: string, author: "customer" | "ai" | "human") =>
      scope.messages.filter((m) => m.enquiryId === id && m.author === author && !m.promotional).length;
    return { eng, rows, counts, trend: engagementSeries(scope) };
  }, [scope]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !scope || !data) return <LoadingState kpis={6} />;

  const columns: Column<Enquiry>[] = [
    {
      key: "customer",
      header: "Customer",
      value: (e) => scope.customers.find((c) => c.id === e.customerId)?.name ?? "Unknown",
      render: (e) => {
        const c = scope.customers.find((x) => x.id === e.customerId);
        return (
          <div>
            <p className="font-medium">{c?.name ?? "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{c?.whatsapp}</p>
          </div>
        );
      },
    },
    { key: "type", header: "Type", value: (e) => e.type },
    {
      key: "last",
      header: "Last message",
      value: (e) => e.lastMessage,
      render: (e) => <span className="line-clamp-1 max-w-[22rem] text-muted-foreground">{e.lastMessage}</span>,
    },
    { key: "cm", header: "Customer msgs", align: "right", value: (e) => data.counts(e.id, "customer") },
    { key: "ai", header: "AI", align: "right", value: (e) => data.counts(e.id, "ai") },
    { key: "human", header: "Human", align: "right", value: (e) => data.counts(e.id, "human") },
    { key: "at", header: "Last interaction", value: (e) => dateTime(e.lastInteractionAt) },
    {
      key: "status",
      header: "Status",
      value: (e) => e.status,
      render: (e) => <StatusBadge status={e.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="WhatsApp Engagement"
        description="How conversations are flowing between customers, the AI assistant and the team."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total conversations" value={fmtInt(data.eng.conversations)} icon={MessageSquare} />
        <KpiCard label="Customer messages received" value={fmtInt(data.eng.customerMessages)} icon={MessageSquare} />
        <KpiCard label="AI responses" value={fmtInt(data.eng.aiResponses)} icon={Bot} />
        <KpiCard label="Human escalations" value={fmtInt(data.eng.escalations)} icon={Headset} tone="warning" />
        <KpiCard
          label="Customer interactions (replies)"
          value={fmtInt(data.eng.customerMessages)}
          icon={Repeat2}
          hint={`${fmtPct(data.eng.customerInteractionRate)} of conversations had multiple customer turns`}
        />
        <KpiCard label="Failed deliveries" value={fmtInt(data.eng.failed)} icon={TriangleAlert} tone="danger" />
      </section>

      <ChartCard
        title="WhatsApp Engagement Trend"
        description="Interactions per day"
        actions={
          <ToggleGroup
            type="multiple"
            size="sm"
            variant="outline"
            value={keys}
            onValueChange={(v) => v.length && setKeys(v as SeriesKey[])}
          >
            {Object.values(SERIES).map((s) => (
              <ToggleGroupItem key={s.key} value={s.key} className="px-2.5 text-xs">
                {s.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      >
        <TrendChart data={data.trend} series={keys.map((k) => SERIES[k])} height={320} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Response Analytics" description="Computed from actual message records">
          <div className="divide-y divide-border">
            <RateRow label="Customer response rate" value={data.eng.customerResponseRate} />
            <RateRow label="AI response rate" value={data.eng.aiResponseRate} />
            <RateRow label="Human escalation rate" value={data.eng.escalationRate} />
            <RateRow label="Conversation completion rate" value={data.eng.completionRate} />
            <RateRow label="Failed delivery rate" value={data.eng.failedRate} />
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
            Average first response time is not available — response timestamps for the agent SLA are not
            captured by the workflow yet.
          </p>
        </ChartCard>

        <ChartCard
          title="Conversations"
          description="Click a conversation to read the thread"
          className="lg:col-span-2"
        >
          <DataTable
            rows={data.rows}
            columns={columns}
            rowKey={(e) => e.id}
            searchValue={(e) =>
              `${scope.customers.find((c) => c.id === e.customerId)?.name ?? ""} ${e.lastMessage} ${e.type}`
            }
            searchPlaceholder="Search conversations…"
            onRowClick={(e) => setSelected(e)}
            exportName="711club-conversations"
            emptyMessage="No conversation data available for the selected period."
          />
        </ChartCard>
      </div>

      <EnquiryDetailSheet
        enquiry={selected}
        scope={scope}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
