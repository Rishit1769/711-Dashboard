import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BedDouble,
  Bot,
  Headset,
  MessageSquare,
  ShieldAlert,
  Tag,
  TriangleAlert,
  UserPlus,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ChartCard, SectionHeading } from "@/components/dashboard/ChartCard";
import { ColumnChart, DonutChart, HorizontalBarChart, TrendChart } from "@/components/dashboard/charts";
import { Funnel } from "@/components/dashboard/Funnel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState, LoadingState } from "@/components/dashboard/PageState";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  customerMetrics,
  dateOnly,
  engagementMetrics,
  engagementSeries,
  enquirySeries,
  enquiryTypeBreakdown,
  fmtInt,
  guestBuckets,
  interestBreakdown,
  offerPerformance,
  pctChange,
  pipelineMetrics,
  countBy,
} from "@/lib/data/analytics";
import { useAnalytics } from "@/lib/data/filters";
import type { EnquiryStatus, EnquiryType } from "@/lib/data/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "711 Club Admin Dashboard — WhatsApp & Enquiry Analytics" },
      {
        name: "description",
        content:
          "Live operational view of 711 Club customers, WhatsApp engagement, offers, buffet and room enquiries, escalations and follow-ups.",
      },
      { property: "og:title", content: "711 Club Admin Dashboard" },
      {
        property: "og:description",
        content:
          "Customers, conversations, enquiries, offers, buffet, rooms, follow-ups and escalations in one management view.",
      },
    ],
  }),
  component: DashboardPage,
});

const TREND_SERIES = {
  customer: { key: "customer", label: "Customer Messages", color: "var(--color-chart-1)" },
  ai: { key: "ai", label: "AI Responses", color: "var(--color-chart-2)" },
  human: { key: "human", label: "Human Responses", color: "var(--color-chart-3)" },
  total: { key: "total", label: "Total Interactions", color: "var(--color-chart-4)" },
  escalations: { key: "escalations", label: "Escalations", color: "var(--color-chart-5)" },
} as const;

type TrendKey = keyof typeof TREND_SERIES;

function DashboardPage() {
  const { scope, previousScope, isLoading, isError, refetch, setFilter } = useAnalytics();
  const navigate = useNavigate();
  const [trendKeys, setTrendKeys] = useState<TrendKey[]>(["customer", "ai"]);

  const data = useMemo(() => {
    if (!scope) return null;
    const cust = customerMetrics(scope);
    const eng = engagementMetrics(scope);
    const pipe = pipelineMetrics(scope);
    const buffet = scope.enquiries.filter((e) => e.type === "Buffet");
    const rooms = scope.enquiries.filter((e) => e.type === "Room");
    return {
      cust,
      eng,
      pipe,
      buffet,
      rooms,
      types: enquiryTypeBreakdown(scope),
      interests: interestBreakdown(scope).slice(0, 8),
      trend: engagementSeries(scope),
      offers: offerPerformance(scope).slice(0, 5),
      buffetSeries: enquirySeries(scope, (e) => e.type === "Buffet"),
      roomTypes: countBy(rooms, (e) => e.roomType),
      services: countBy(
        scope.enquiries.filter((e) => e.type === "Service"),
        (e) => e.serviceCategory,
      ),
      guests: guestBuckets(buffet),
      followUps: scope.enquiries
        .filter((e) => e.followUpRequired)
        .sort((a, b) => (a.followUpDueAt ?? "").localeCompare(b.followUpDueAt ?? ""))
        .slice(0, 6),
    };
  }, [scope]);

  const prev = useMemo(() => {
    if (!previousScope) return null;
    return {
      cust: customerMetrics(previousScope),
      eng: engagementMetrics(previousScope),
    };
  }, [previousScope]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !scope || !data) return <LoadingState />;

  const goEnquiries = (status?: EnquiryStatus, type?: EnquiryType) => {
    if (status) setFilter("status", status);
    if (type) setFilter("type", type);
    void navigate({ to: "/enquiries" });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Row 1 — customers */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Customers / Enquiries"
          value={fmtInt(data.cust.total)}
          hint={`${fmtInt(scope.enquiries.length)} enquiry records`}
          icon={UsersRound}
          change={prev ? pctChange(data.cust.total, prev.cust.total) : undefined}
          onClick={() => navigate({ to: "/customers" })}
        />
        <KpiCard
          label="New Customers"
          value={fmtInt(data.cust.new)}
          icon={UserPlus}
          change={prev ? pctChange(data.cust.new, prev.cust.new) : undefined}
          onClick={() => {
            setFilter("customer", "new");
            void navigate({ to: "/customers" });
          }}
        />
        <KpiCard
          label="Returning Customers"
          value={fmtInt(data.cust.returning)}
          icon={UsersRound}
          hint={`${fmtInt(data.cust.unidentified)} could not be matched (Unknown)`}
          onClick={() => {
            setFilter("customer", "returning");
            void navigate({ to: "/customers" });
          }}
        />
        <KpiCard
          label="Total Conversations"
          value={fmtInt(data.eng.conversations)}
          icon={MessageSquare}
          change={prev ? pctChange(data.eng.conversations, prev.eng.conversations) : undefined}
          onClick={() => navigate({ to: "/conversations" })}
        />
      </section>

      {/* Row 2 — WhatsApp engagement */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Customer Messages"
          value={fmtInt(data.eng.customerMessages)}
          icon={MessageSquare}
          change={prev ? pctChange(data.eng.customerMessages, prev.eng.customerMessages) : undefined}
          onClick={() => navigate({ to: "/conversations" })}
        />
        <KpiCard
          label="AI Responses"
          value={fmtInt(data.eng.aiResponses)}
          icon={Bot}
          change={prev ? pctChange(data.eng.aiResponses, prev.eng.aiResponses) : undefined}
          onClick={() => navigate({ to: "/conversations" })}
        />
        <KpiCard
          label="Human Escalations"
          value={fmtInt(data.eng.escalations)}
          icon={Headset}
          tone="warning"
          change={prev ? pctChange(data.eng.escalations, prev.eng.escalations) : undefined}
          invertChange
          onClick={() => goEnquiries("Escalated")}
        />
        <KpiCard
          label="Failed Deliveries"
          value={fmtInt(data.eng.failed)}
          icon={TriangleAlert}
          tone="danger"
          change={prev ? pctChange(data.eng.failed, prev.eng.failed) : undefined}
          invertChange
          onClick={() => navigate({ to: "/conversations" })}
        />
      </section>

      {/* Row 3 — engagement trend */}
      <ChartCard
        title="WhatsApp Engagement Trend"
        description="Interactions per day across the selected period"
        actions={
          <ToggleGroup
            type="multiple"
            size="sm"
            variant="outline"
            value={trendKeys}
            onValueChange={(v) => v.length && setTrendKeys(v as TrendKey[])}
          >
            {Object.values(TREND_SERIES).map((s) => (
              <ToggleGroupItem key={s.key} value={s.key} className="px-2.5 text-xs">
                {s.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      >
        <TrendChart data={data.trend} series={trendKeys.map((k) => TREND_SERIES[k])} height={300} />
      </ChartCard>

      {/* Row 4 — enquiry breakdown */}
      <div>
        <SectionHeading
          title="Enquiry Breakdown"
          description="What customers are asking about, and what they told us they care about"
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Enquiries by Type" description="Click a segment to drill into those enquiries">
            <DonutChart
              data={data.types}
              onSelect={(name) => goEnquiries(undefined, name as EnquiryType)}
            />
          </ChartCard>
          <ChartCard
            title="Customer Interests & Preferences"
            description="Only interests actually captured in conversation"
          >
            <HorizontalBarChart data={data.interests} color="var(--color-chart-4)" />
          </ChartCard>
        </div>
      </div>

      {/* Row 5 — offers */}
      <div>
        <SectionHeading
          title="Offer Performance"
          description="Promotional reach, enquiries generated and captured conversions"
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/offers" })}>
              <Tag className="size-4" /> All offer analytics
            </Button>
          }
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Customer Interest by Offer" description="Offer-related enquiries">
            <HorizontalBarChart
              data={data.offers.map((o) => ({ name: o.name, value: o.enquiries }))}
              color="var(--color-chart-2)"
              valueLabel="Enquiries"
            />
          </ChartCard>
          <ChartCard title="Offer Conversions" description="Bookings captured by the workflow">
            <ul className="flex flex-col divide-y divide-border">
              {data.offers.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{o.name}</span>
                  <span className="tabular text-muted-foreground">{o.sent} sent</span>
                  <span className="tabular w-16 text-right font-semibold">{o.conversions}</span>
                  <span className="tabular w-16 text-right text-muted-foreground">
                    {o.conversionRate === null ? "N/A" : `${o.conversionRate.toFixed(1)}%`}
                  </span>
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>
      </div>

      {/* Row 6 — buffet */}
      <div>
        <SectionHeading
          title="Buffet Analytics"
          description="Weekly buffet demand and requested group sizes"
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/buffet" })}>
              <UtensilsCrossed className="size-4" /> Buffet detail
            </Button>
          }
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ChartCard title="Buffet Enquiries by Date" className="lg:col-span-2">
            <ColumnChart data={data.buffetSeries} color="var(--color-chart-2)" height={240} />
          </ChartCard>
          <ChartCard title="Requested Guests">
            <HorizontalBarChart
              data={data.guests}
              color="var(--color-chart-4)"
              valueLabel="Enquiries"
              height={240}
            />
          </ChartCard>
        </div>
      </div>

      {/* Row 7 — rooms & services */}
      <div>
        <SectionHeading
          title="Room / Hotel Analytics"
          description="Room demand by category and service enquiries"
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/rooms" })}>
              <BedDouble className="size-4" /> Rooms detail
            </Button>
          }
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Room Enquiries by Type / Category">
            <HorizontalBarChart
              data={data.roomTypes}
              color="var(--color-chart-1)"
              valueLabel="Enquiries"
              height={240}
            />
          </ChartCard>
          <ChartCard title="Hotel / Service Enquiries">
            <HorizontalBarChart
              data={data.services}
              color="var(--color-chart-3)"
              valueLabel="Enquiries"
              height={240}
            />
          </ChartCard>
        </div>
      </div>

      {/* Row 8 & 9 — pipeline + follow-up queue */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Enquiry Pipeline"
          description="New → Follow-up → Pending → Escalated → Closed / Converted"
        >
          <Funnel
            onSelect={(name) => goEnquiries(name as EnquiryStatus)}
            stages={[
              { name: "New", value: data.pipe.New, tone: "default" },
              { name: "Follow-up Required", value: data.pipe["Follow-up Required"], tone: "warning" },
              { name: "Pending", value: data.pipe.Pending, tone: "warning" },
              { name: "Escalated", value: data.pipe.Escalated, tone: "danger" },
              { name: "Closed", value: data.pipe.Closed, tone: "muted" },
              { name: "Converted", value: data.pipe.Converted, tone: "success" },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Follow-up Required"
          description={`${data.pipe.followUps} enquiries waiting on the team`}
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/follow-ups" })}>
              Open queue
            </Button>
          }
        >
          <ul className="flex flex-col divide-y divide-border">
            {data.followUps.map((f) => {
              const c = scope.customers.find((x) => x.id === f.customerId);
              return (
                <li key={f.id} className="flex flex-wrap items-center gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c?.name ?? "Unknown"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.type} · due {dateOnly(f.followUpDueAt)} · {f.assignedTo}
                    </p>
                  </div>
                  <PriorityBadge priority={f.priority} />
                  <StatusBadge status={f.status} />
                </li>
              );
            })}
            {data.followUps.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No follow-ups pending for the selected period.
              </li>
            ) : null}
          </ul>
        </ChartCard>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <ShieldAlert className="size-4 shrink-0" />
        Conversion and returning-customer figures are shown only where the workflow actually captures
        them; anything not captured appears as N/A or Unknown.
      </div>
    </div>
  );
}
