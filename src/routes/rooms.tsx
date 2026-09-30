import { createFileRoute } from "@tanstack/react-router";
import { BedDouble, ConciergeBell, Clock, ShieldAlert, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { HorizontalBarChart, TrendChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { EnquiryDetailSheet } from "@/components/dashboard/details";
import { Funnel } from "@/components/dashboard/Funnel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState, LoadingState, PageHeader } from "@/components/dashboard/PageState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { countBy, dateOnly, enquirySeries, fmtInt } from "@/lib/data/analytics";
import { useAnalytics } from "@/lib/data/filters";
import type { Enquiry } from "@/lib/data/types";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Room & Hotel Enquiries — 711 Club Admin" },
      {
        name: "description",
        content:
          "Room enquiry volume by category, hotel service enquiries, pending and escalated room requests for 711 Club.",
      },
      { property: "og:title", content: "Room & Hotel Enquiries — 711 Club" },
      {
        property: "og:description",
        content: "Room demand by category, service enquiries and the room enquiry status pipeline.",
      },
    ],
  }),
  component: RoomsPage,
});

function RoomsPage() {
  const { scope, isLoading, isError, refetch } = useAnalytics();
  const [roomType, setRoomType] = useState<string | null>(null);
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const data = useMemo(() => {
    if (!scope) return null;
    const rooms = scope.enquiries.filter((e) => e.type === "Room");
    const services = scope.enquiries.filter((e) => e.type === "Service");
    const filtered = roomType ? rooms.filter((e) => e.roomType === roomType) : rooms;
    return {
      rooms,
      services,
      filtered,
      types: countBy(rooms, (e) => e.roomType),
      serviceTypes: countBy(services, (e) => e.serviceCategory),
      trend: enquirySeries(scope, (e) => e.type === "Room" && (!roomType || e.roomType === roomType)),
      uniqueCustomers: new Set(rooms.map((e) => e.customerId)).size,
      pending: rooms.filter((e) => e.status === "Pending" || e.status === "New").length,
      escalated: rooms.filter((e) => e.status === "Escalated").length,
      stages: [
        { name: "New", value: rooms.filter((e) => e.status === "New").length },
        {
          name: "Follow-up",
          value: rooms.filter((e) => e.status === "Follow-up Required").length,
          tone: "warning" as const,
        },
        { name: "Pending", value: rooms.filter((e) => e.status === "Pending").length, tone: "warning" as const },
        {
          name: "Escalated",
          value: rooms.filter((e) => e.status === "Escalated").length,
          tone: "danger" as const,
        },
        { name: "Closed", value: rooms.filter((e) => e.status === "Closed").length, tone: "muted" as const },
        {
          name: "Converted",
          value: rooms.filter((e) => e.conversionStatus === "Booked").length,
          tone: "success" as const,
        },
      ],
    };
  }, [scope, roomType]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !scope || !data) return <LoadingState kpis={5} />;

  const nameOf = (e: Enquiry) =>
    scope.customers.find((c) => c.id === e.customerId)?.name ?? "Unknown";

  const columns: Column<Enquiry>[] = [
    { key: "customer", header: "Customer", value: nameOf },
    { key: "roomType", header: "Room type", value: (e) => e.roomType ?? "Not captured" },
    { key: "created", header: "Enquiry date", value: (e) => e.createdAt, render: (e) => dateOnly(e.createdAt) },
    {
      key: "status",
      header: "Status",
      value: (e) => e.status,
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: "conv",
      header: "Booking status",
      value: (e) => e.conversionStatus ?? "Not captured",
      render: (e) => <StatusBadge status={e.conversionStatus ?? "Not captured"} />,
    },
    { key: "assigned", header: "Assigned to", value: (e) => e.assignedTo },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Room & Hotel Enquiry Analytics"
        description="Room demand by category plus hotel service requests, tracked separately."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total room enquiries" value={fmtInt(data.rooms.length)} icon={BedDouble} />
        <KpiCard label="Unique customers enquiring" value={fmtInt(data.uniqueCustomers)} icon={UsersRound} />
        <KpiCard label="Service / hotel enquiries" value={fmtInt(data.services.length)} icon={ConciergeBell} />
        <KpiCard label="Pending room enquiries" value={fmtInt(data.pending)} icon={Clock} tone="warning" />
        <KpiCard label="Escalated room enquiries" value={fmtInt(data.escalated)} icon={ShieldAlert} tone="danger" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Room Enquiries by Type / Category"
          description={roomType ? `Filtered: ${roomType} — click again to clear` : "Click a bar to filter"}
        >
          <HorizontalBarChart
            data={data.types}
            activeName={roomType}
            onSelect={(name) => setRoomType(roomType === name ? null : name)}
            color="var(--color-chart-1)"
            valueLabel="Enquiries"
            height={280}
          />
        </ChartCard>
        <ChartCard title="Hotel / Service Enquiries" description="Tracked separately from room requests">
          <HorizontalBarChart
            data={data.serviceTypes}
            color="var(--color-chart-3)"
            valueLabel="Enquiries"
            height={280}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Room Enquiry Trend" className="lg:col-span-2">
          <TrendChart
            data={data.trend}
            series={[{ key: "value", label: "Room enquiries", color: "var(--color-chart-1)" }]}
            height={280}
          />
        </ChartCard>
        <ChartCard
          title="Room Enquiry Status"
          description="Converted shown only where captured"
        >
          <Funnel stages={data.stages} />
        </ChartCard>
      </div>

      <ChartCard title="Room Enquiries" description="Click a row for the full enquiry">
        <DataTable
          rows={data.filtered}
          columns={columns}
          rowKey={(e) => e.id}
          searchValue={(e) => `${nameOf(e)} ${e.roomType ?? ""} ${e.status}`}
          searchPlaceholder="Search customer, room type…"
          onRowClick={(e) => setSelected(e)}
          exportName="711club-room-enquiries"
          pageSize={10}
          emptyMessage="No room enquiry data available for the selected period."
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
