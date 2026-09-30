import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Clock, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { ColumnChart, HorizontalBarChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { EnquiryDetailSheet } from "@/components/dashboard/details";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState, LoadingState, PageHeader } from "@/components/dashboard/PageState";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  dateOnly,
  enquirySeries,
  fmtInt,
  guestBuckets,
  monthlyBuckets,
  weeklyBuckets,
} from "@/lib/data/analytics";
import { useAnalytics } from "@/lib/data/filters";
import type { Enquiry } from "@/lib/data/types";

export const Route = createFileRoute("/buffet")({
  head: () => ({
    meta: [
      { title: "Weekly Buffet Analytics — 711 Club Admin" },
      {
        name: "description",
        content:
          "Buffet enquiry volume, requested dates, guest counts, status tracking and pending follow-ups for the 711 Club weekly buffet.",
      },
      { property: "og:title", content: "Weekly Buffet Analytics — 711 Club" },
      {
        property: "og:description",
        content: "Buffet demand by date, requested guests, statuses and follow-ups awaiting the team.",
      },
    ],
  }),
  component: BuffetPage,
});

function BuffetPage() {
  const { scope, isLoading, isError, refetch } = useAnalytics();
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const data = useMemo(() => {
    if (!scope) return null;
    const buffet = scope.enquiries.filter((e) => e.type === "Buffet");
    const daily = enquirySeries(scope, (e) => e.type === "Buffet");
    return {
      buffet,
      daily,
      weekly: weeklyBuckets(daily),
      monthly: monthlyBuckets(daily),
      guests: guestBuckets(buffet),
      interested: buffet.filter((e) =>
        ["Interested", "Enquiry", "Follow-up", "Booked"].includes(e.conversionStatus ?? ""),
      ).length,
      pending: buffet.filter((e) => e.status === "Pending" || e.status === "New").length,
      confirmed: buffet.filter((e) => e.conversionStatus === "Booked").length,
      followUps: buffet
        .filter((e) => e.followUpRequired)
        .sort((a, b) => (a.followUpDueAt ?? "").localeCompare(b.followUpDueAt ?? "")),
    };
  }, [scope]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !scope || !data) return <LoadingState kpis={4} />;

  const nameOf = (e: Enquiry) =>
    scope.customers.find((c) => c.id === e.customerId)?.name ?? "Unknown";

  const columns: Column<Enquiry>[] = [
    {
      key: "customer",
      header: "Customer",
      value: nameOf,
      render: (e) => <span className="font-medium">{nameOf(e)}</span>,
    },
    { key: "created", header: "Enquiry date", value: (e) => e.createdAt, render: (e) => dateOnly(e.createdAt) },
    {
      key: "requested",
      header: "Requested buffet date",
      value: (e) => e.buffetDate ?? "",
      render: (e) => dateOnly(e.buffetDate),
    },
    { key: "guests", header: "Guests", align: "right", value: (e) => e.guests ?? 0 },
    {
      key: "status",
      header: "Status",
      value: (e) => e.status,
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: "followup",
      header: "Follow-up",
      value: (e) => (e.followUpRequired ? dateOnly(e.followUpDueAt) : "Not required"),
      render: (e) =>
        e.followUpRequired ? (
          <span className="text-xs">{dateOnly(e.followUpDueAt)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Not required</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Weekly Buffet Analytics"
        description="Buffet demand, requested dates and group sizes captured over WhatsApp."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total buffet enquiries" value={fmtInt(data.buffet.length)} icon={UtensilsCrossed} />
        <KpiCard label="Interested customers" value={fmtInt(data.interested)} icon={CalendarClock} />
        <KpiCard label="Pending buffet enquiries" value={fmtInt(data.pending)} icon={Clock} tone="warning" />
        <KpiCard
          label="Confirmed buffet bookings"
          value={fmtInt(data.confirmed)}
          icon={CheckCircle2}
          tone="success"
          hint="Only where confirmation is captured"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Buffet Enquiries by Date" className="lg:col-span-2">
          <ColumnChart data={data.daily} color="var(--color-chart-2)" height={260} />
        </ChartCard>
        <ChartCard title="Requested Number of Guests">
          <HorizontalBarChart
            data={data.guests}
            color="var(--color-chart-4)"
            valueLabel="Enquiries"
            height={260}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Weekly Buffet Enquiry Trend" description="Grouped by week commencing">
          <ColumnChart data={data.weekly} color="var(--color-chart-1)" height={240} />
        </ChartCard>
        <ChartCard title="Monthly Buffet Enquiry Trend" description="Grouped by month">
          <ColumnChart data={data.monthly} color="var(--color-chart-3)" height={240} />
        </ChartCard>
      </div>

      <ChartCard title="Buffet Requested Dates" description="Click a row for the full enquiry">
        <DataTable
          rows={data.buffet}
          columns={columns}
          rowKey={(e) => e.id}
          searchValue={(e) => `${nameOf(e)} ${e.status}`}
          searchPlaceholder="Search customer or status…"
          onRowClick={(e) => setSelected(e)}
          exportName="711club-buffet-enquiries"
          pageSize={10}
          emptyMessage="No buffet enquiry data available for the selected period."
        />
      </ChartCard>

      <ChartCard
        title="Pending Buffet Follow-ups"
        description={`${data.followUps.length} buffet enquiries need a follow-up`}
      >
        <ul className="flex flex-col divide-y divide-border">
          {data.followUps.slice(0, 8).map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{nameOf(f)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {f.guests ?? "?"} guests · buffet {dateOnly(f.buffetDate)} · due{" "}
                  {dateOnly(f.followUpDueAt)} · {f.assignedTo}
                </p>
              </div>
              <PriorityBadge priority={f.priority} />
              <StatusBadge status={f.status} />
            </li>
          ))}
          {data.followUps.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No buffet follow-ups pending.
            </li>
          ) : null}
        </ul>
      </ChartCard>

      <EnquiryDetailSheet
        enquiry={selected}
        scope={scope}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
