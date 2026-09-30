import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MessageSquare, UserCheck, UserPlus, UsersRound } from "lucide-react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { DonutChart, HorizontalBarChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { CustomerDetailSheet } from "@/components/dashboard/details";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState, LoadingState, PageHeader } from "@/components/dashboard/PageState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  customerLabel,
  customerMetrics,
  dateOnly,
  dateTime,
  enquiryTypeBreakdown,
  fmtInt,
  interestBreakdown,
} from "@/lib/data/analytics";
import { useAnalytics } from "@/lib/data/filters";
import type { Customer, EnquiryType } from "@/lib/data/types";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customer Analytics — 711 Club Admin" },
      {
        name: "description",
        content:
          "New and returning 711 Club customers, enquiry types and captured interests, with a drill-down customer profile.",
      },
      { property: "og:title", content: "Customer Analytics — 711 Club" },
      {
        property: "og:description",
        content: "Customer summary, enquiry types and captured interests for the 711 Club team.",
      },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { scope, isLoading, isError, refetch, setFilter } = useAnalytics();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const data = useMemo(() => {
    if (!scope) return null;
    const ids = new Set(scope.enquiries.map((e) => e.customerId));
    const rows = scope.customers.filter((c) => ids.has(c.id));
    return {
      metrics: customerMetrics(scope),
      rows,
      types: enquiryTypeBreakdown(scope),
      interests: interestBreakdown(scope),
      countFor: (id: string) => scope.enquiries.filter((e) => e.customerId === id).length,
    };
  }, [scope]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !scope || !data) return <LoadingState kpis={4} />;

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      value: (c) => c.name,
      render: (c) => (
        <div>
          <p className="font-medium">{c.name}</p>
          <p className="text-xs text-muted-foreground">{c.whatsapp}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Customer type",
      value: (c) => customerLabel(c),
      render: (c) => <StatusBadge status={customerLabel(c)} />,
    },
    {
      key: "interests",
      header: "Interests",
      value: (c) => c.interests.join(" / ") || "Not captured",
      render: (c) => (
        <span className="flex flex-wrap gap-1">
          {c.interests.length ? (
            c.interests.map((i) => <StatusBadge key={i} status={i} />)
          ) : (
            <span className="text-xs text-muted-foreground">Not captured</span>
          )}
        </span>
      ),
    },
    { key: "enquiries", header: "Enquiries", align: "right", value: (c) => data.countFor(c.id) },
    { key: "first", header: "First interaction", value: (c) => dateOnly(c.firstInteractionAt) },
    { key: "last", header: "Last interaction", value: (c) => dateTime(c.lastInteractionAt) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customer Analytics"
        description="Who is talking to 711 Club on WhatsApp, and what they care about."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total customer records" value={fmtInt(data.metrics.total)} icon={UsersRound} />
        <KpiCard label="New customers" value={fmtInt(data.metrics.new)} icon={UserPlus} />
        <KpiCard
          label="Returning customers"
          value={fmtInt(data.metrics.returning)}
          icon={UserCheck}
          hint={`${fmtInt(data.metrics.unidentified)} unmatched (Unknown)`}
        />
        <KpiCard
          label="Unique customers on WhatsApp"
          value={fmtInt(data.metrics.uniqueOnWhatsApp)}
          icon={MessageSquare}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Customer Enquiry Type" description="Click a segment to filter enquiries">
          <DonutChart
            data={data.types}
            onSelect={(name) => {
              setFilter("type", name as EnquiryType);
              void navigate({ to: "/enquiries" });
            }}
          />
        </ChartCard>
        <ChartCard
          title="Customer Interests & Preferences"
          description="Share of customers with each captured interest"
        >
          <HorizontalBarChart data={data.interests} color="var(--color-chart-4)" height={320} />
        </ChartCard>
      </div>

      <ChartCard title="Customers" description="Click a customer to open their full profile">
        <DataTable
          rows={data.rows}
          columns={columns}
          rowKey={(c) => c.id}
          searchValue={(c) => `${c.name} ${c.whatsapp} ${c.interests.join(" ")}`}
          searchPlaceholder="Search name or number…"
          onRowClick={(c) => setSelected(c.id)}
          exportName="711club-customers"
          pageSize={10}
          emptyMessage="No customer data available for the selected period."
        />
      </ChartCard>

      <CustomerDetailSheet
        customerId={selected}
        scope={scope}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
