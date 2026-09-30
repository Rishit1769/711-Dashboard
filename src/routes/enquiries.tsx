import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { DonutChart, TrendChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { EnquiryDetailSheet } from "@/components/dashboard/details";
import { Funnel } from "@/components/dashboard/Funnel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState, LoadingState, PageHeader } from "@/components/dashboard/PageState";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  dateOnly,
  dateTime,
  enquirySeries,
  enquiryTypeBreakdown,
  fmtInt,
  pipelineMetrics,
} from "@/lib/data/analytics";
import { useAnalytics } from "@/lib/data/filters";
import type { Enquiry, EnquiryStatus, EnquiryType } from "@/lib/data/types";

export const Route = createFileRoute("/enquiries")({
  head: () => ({
    meta: [
      { title: "Enquiry Pipeline — 711 Club Admin" },
      {
        name: "description",
        content:
          "Track 711 Club enquiries from new to converted: pipeline stages, escalations, follow-ups and a searchable enquiry table.",
      },
      { property: "og:title", content: "Enquiry Pipeline — 711 Club" },
      {
        property: "og:description",
        content: "New, follow-up, pending, escalated, closed and converted enquiries in one view.",
      },
    ],
  }),
  component: EnquiriesPage,
});

function EnquiriesPage() {
  const { scope, isLoading, isError, refetch, filters, setFilter } = useAnalytics();
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const data = useMemo(() => {
    if (!scope) return null;
    return {
      pipe: pipelineMetrics(scope),
      types: enquiryTypeBreakdown(scope),
      series: enquirySeries(scope),
      rows: [...scope.enquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  }, [scope]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !scope || !data) return <LoadingState kpis={6} />;

  const toggleStatus = (s: EnquiryStatus) =>
    setFilter("status", filters.status === s ? "all" : s);

  const columns: Column<Enquiry>[] = [
    {
      key: "customer",
      header: "Customer",
      value: (e) => scope.customers.find((c) => c.id === e.customerId)?.name ?? "Unknown",
      render: (e) => (
        <span className="font-medium">
          {scope.customers.find((c) => c.id === e.customerId)?.name ?? "Unknown"}
        </span>
      ),
    },
    {
      key: "whatsapp",
      header: "WhatsApp",
      value: (e) => scope.customers.find((c) => c.id === e.customerId)?.whatsapp ?? "Unknown",
    },
    { key: "type", header: "Enquiry type", value: (e) => e.type },
    { key: "created", header: "Enquiry date", value: (e) => e.createdAt, render: (e) => dateOnly(e.createdAt) },
    {
      key: "last",
      header: "Last interaction",
      value: (e) => e.lastInteractionAt,
      render: (e) => dateTime(e.lastInteractionAt),
    },
    {
      key: "status",
      header: "Status",
      value: (e) => e.status,
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: "followup",
      header: "Follow-up",
      value: (e) => (e.followUpRequired ? "Required" : "No"),
      render: (e) =>
        e.followUpRequired ? (
          <div className="flex items-center gap-2">
            <PriorityBadge priority={e.priority} />
            <span className="text-xs text-muted-foreground">{dateOnly(e.followUpDueAt)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not required</span>
        ),
    },
    { key: "assigned", header: "Assigned to", value: (e) => e.assignedTo },
    { key: "source", header: "Source", value: (e) => e.source },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Enquiries & Pipeline"
        description="Every enquiry captured over WhatsApp, and where it currently stands."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(
          [
            ["New", data.pipe.New, "default"],
            ["Follow-up Required", data.pipe["Follow-up Required"], "warning"],
            ["Pending", data.pipe.Pending, "warning"],
            ["Escalated", data.pipe.Escalated, "danger"],
            ["Closed", data.pipe.Closed, "default"],
            ["Converted", data.pipe.Converted, "success"],
          ] as [EnquiryStatus, number, "default" | "warning" | "danger" | "success"][]
        ).map(([status, value, tone]) => (
          <KpiCard
            key={status}
            label={status}
            value={fmtInt(value)}
            tone={tone}
            hint="Click to filter the table"
            onClick={() => toggleStatus(status)}
            active={filters.status === status}
          />
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Enquiry Pipeline" description="Click a stage to filter">
          <Funnel
            activeName={filters.status === "all" ? null : filters.status}
            onSelect={(name) => toggleStatus(name as EnquiryStatus)}
            stages={[
              { name: "New", value: data.pipe.New },
              { name: "Follow-up Required", value: data.pipe["Follow-up Required"], tone: "warning" },
              { name: "Pending", value: data.pipe.Pending, tone: "warning" },
              { name: "Escalated", value: data.pipe.Escalated, tone: "danger" },
              { name: "Closed", value: data.pipe.Closed, tone: "muted" },
              { name: "Converted", value: data.pipe.Converted, tone: "success" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Enquiries by Type" description="Click a segment to filter">
          <DonutChart
            data={data.types}
            activeName={filters.type === "all" ? null : filters.type}
            onSelect={(name) =>
              setFilter("type", filters.type === name ? "all" : (name as EnquiryType))
            }
          />
        </ChartCard>
        <ChartCard title="Enquiries per Day">
          <TrendChart
            data={data.series}
            series={[{ key: "value", label: "Enquiries", color: "var(--color-chart-1)" }]}
            height={280}
          />
        </ChartCard>
      </div>

      <ChartCard title="All Enquiries" description="Sort, search, page and export the filtered set">
        <DataTable
          rows={data.rows}
          columns={columns}
          rowKey={(e) => e.id}
          searchValue={(e) =>
            `${scope.customers.find((c) => c.id === e.customerId)?.name ?? ""} ${e.type} ${e.status} ${e.assignedTo}`
          }
          searchPlaceholder="Search customer, type, staff…"
          onRowClick={(e) => setSelected(e)}
          exportName="711club-enquiries"
          pageSize={10}
          emptyMessage="No enquiry data available for the selected period."
        />
      </ChartCard>

      <EnquiryDetailSheet
        enquiry={selected}
        scope={scope}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
