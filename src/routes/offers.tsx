import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, MailCheck, MessageSquare, Send, Tag } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { DonutChart, HorizontalBarChart, TrendChart } from "@/components/dashboard/charts";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState, LoadingState, PageHeader } from "@/components/dashboard/PageState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  conversionBreakdown,
  dateOnly,
  enquirySeries,
  fmtInt,
  fmtPct,
  offerPerformance,
  type OfferPerformance,
} from "@/lib/data/analytics";
import { useAnalytics } from "@/lib/data/filters";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offer Analytics — 711 Club Admin" },
      {
        name: "description",
        content:
          "Which 711 Club offers reach customers, generate enquiries and produce captured bookings, with per-offer drill-down.",
      },
      { property: "og:title", content: "Offer Analytics — 711 Club" },
      {
        property: "og:description",
        content: "Promotional reach, offer enquiries, responses and captured conversions per offer.",
      },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { scope, isLoading, isError, refetch } = useAnalytics();
  const [offerFilter, setOfferFilter] = useState<string>("all");
  const [detail, setDetail] = useState<OfferPerformance | null>(null);

  const data = useMemo(() => {
    if (!scope) return null;
    const perf = offerPerformance(scope);
    const related = scope.enquiries.filter((e) => e.offerId);
    const promos = scope.messages.filter((m) => m.promotional);
    const scoped = offerFilter === "all" ? related : related.filter((e) => e.offerId === offerFilter);
    return {
      perf,
      totals: {
        sent: promos.length,
        engaged: new Set(related.map((e) => e.customerId)).size,
        enquiries: related.length,
        responses: scope.messages.filter(
          (m) => m.author === "customer" && related.some((e) => e.id === m.enquiryId),
        ).length,
        conversions: related.filter((e) => e.conversionStatus === "Booked").length,
      },
      trend: enquirySeries(scope, (e) =>
        offerFilter === "all" ? !!e.offerId : e.offerId === offerFilter,
      ),
      conversion: conversionBreakdown(scope, (e) =>
        offerFilter === "all" ? !!e.offerId : e.offerId === offerFilter,
      ),
      scopedCount: scoped.length,
    };
  }, [scope, offerFilter]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !scope || !data) return <LoadingState kpis={5} />;

  const columns: Column<OfferPerformance>[] = [
    {
      key: "name",
      header: "Offer",
      value: (o) => o.name,
      render: (o) => (
        <div>
          <p className="font-medium">{o.name}</p>
          <p className="text-xs text-muted-foreground">{o.segment}</p>
        </div>
      ),
    },
    { key: "sent", header: "Communications sent", align: "right", value: (o) => o.sent },
    { key: "engaged", header: "Customers engaged", align: "right", value: (o) => o.customersEngaged },
    { key: "enq", header: "Enquiries", align: "right", value: (o) => o.enquiries },
    { key: "res", header: "Responses", align: "right", value: (o) => o.responses },
    { key: "conv", header: "Conversions", align: "right", value: (o) => o.conversions },
    {
      key: "rate",
      header: "Conversion rate",
      align: "right",
      value: (o) => o.conversionRate ?? -1,
      render: (o) => fmtPct(o.conversionRate),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Offer Analytics"
        description="Which promotions are actually creating conversations and bookings."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Promotional communications sent" value={fmtInt(data.totals.sent)} icon={Send} />
        <KpiCard label="Customers engaging with promotions" value={fmtInt(data.totals.engaged)} icon={MailCheck} />
        <KpiCard label="Offer-related enquiries" value={fmtInt(data.totals.enquiries)} icon={Tag} />
        <KpiCard label="Offer responses" value={fmtInt(data.totals.responses)} icon={MessageSquare} />
        <KpiCard
          label="Bookings / conversions"
          value={fmtInt(data.totals.conversions)}
          icon={BadgePercent}
          tone="success"
          hint="Only where captured by the workflow"
        />
      </section>

      <ChartCard
        title="Offer Performance"
        description="Click an offer to open its detail"
        actions={
          <Select value={offerFilter} onValueChange={setOfferFilter}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All offers</SelectItem>
              {scope.offers.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <DataTable
          rows={data.perf}
          columns={columns}
          rowKey={(o) => o.id}
          searchValue={(o) => `${o.name} ${o.segment}`}
          searchPlaceholder="Search offers…"
          onRowClick={(o) => setDetail(o)}
          exportName="711club-offer-performance"
          pageSize={6}
          emptyMessage="No offer data available for the selected period."
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Customer Interest by Offer" description="Offer-related enquiries in period">
          <HorizontalBarChart
            data={data.perf.map((o) => ({ name: o.name, value: o.enquiries }))}
            color="var(--color-chart-2)"
            valueLabel="Enquiries"
            height={300}
          />
        </ChartCard>
        <ChartCard
          title="Offer Engagement Trend"
          description={
            offerFilter === "all"
              ? "All offer-related enquiries per day"
              : `${scope.offers.find((o) => o.id === offerFilter)?.name} · ${data.scopedCount} enquiries`
          }
        >
          <TrendChart
            data={data.trend}
            series={[{ key: "value", label: "Offer enquiries", color: "var(--color-chart-2)" }]}
            height={300}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Conversion / Booking Status"
        description="Shown only where the workflow captures an outcome"
      >
        <DonutChart data={data.conversion} />
      </ChartCard>

      <Sheet open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.name}</SheetTitle>
                <SheetDescription>
                  Segment: {detail.segment} ·{" "}
                  {(() => {
                    const o = scope.offers.find((x) => x.id === detail.id);
                    return o ? `${dateOnly(o.validFrom)} – ${dateOnly(o.validTo)}` : "Validity not captured";
                  })()}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 pb-8">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Communications sent", fmtInt(detail.sent)],
                    ["Customers engaged", fmtInt(detail.customersEngaged)],
                    ["Enquiries", fmtInt(detail.enquiries)],
                    ["Responses", fmtInt(detail.responses)],
                    ["Conversions", fmtInt(detail.conversions)],
                    ["Conversion rate", fmtPct(detail.conversionRate)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border bg-secondary/40 p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="metric-value mt-1 text-lg">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Enquiries for this offer
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {scope.enquiries
                      .filter((e) => e.offerId === detail.id)
                      .slice(0, 12)
                      .map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {scope.customers.find((c) => c.id === e.customerId)?.name ?? "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {e.type} · {dateOnly(e.createdAt)}
                            </p>
                          </div>
                          <StatusBadge status={e.conversionStatus ?? e.status} />
                        </li>
                      ))}
                  </ul>
                </div>

                <Button variant="outline" onClick={() => setOfferFilter(detail.id)}>
                  Filter dashboard charts by this offer
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
