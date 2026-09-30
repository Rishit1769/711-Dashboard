import { createFileRoute } from "@tanstack/react-router";
import { Download, FileBarChart } from "lucide-react";
import { toast } from "sonner";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { ErrorState, LoadingState, PageHeader } from "@/components/dashboard/PageState";
import { Button } from "@/components/ui/button";
import {
  customerLabel,
  customerMetrics,
  dateOnly,
  dateTime,
  engagementMetrics,
  fmtInt,
  fmtPct,
  offerPerformance,
  pipelineMetrics,
} from "@/lib/data/analytics";
import { useAnalytics } from "@/lib/data/filters";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Exports — 711 Club Admin" },
      {
        name: "description",
        content:
          "Download filtered 711 Club analytics: enquiries, customers, offer performance and the WhatsApp engagement summary.",
      },
      { property: "og:title", content: "Reports & Exports — 711 Club" },
      {
        property: "og:description",
        content: "Export the current filtered period as CSV for management reporting.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { scope, isLoading, isError, refetch, range } = useAnalytics();

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !scope) return <LoadingState kpis={0} />;

  const stamp = range.from.toISOString().slice(0, 10);
  const eng = engagementMetrics(scope);
  const cust = customerMetrics(scope);
  const pipe = pipelineMetrics(scope);

  const reports = [
    {
      name: "Enquiry register",
      description: "Every enquiry in the selected period with status, follow-up and owner.",
      rows: scope.enquiries.length,
      run: () =>
        downloadCsv(
          `711club-enquiry-register-${stamp}`,
          ["Customer", "WhatsApp", "Type", "Enquiry date", "Last interaction", "Status", "Follow-up due", "Assigned", "Conversion"],
          scope.enquiries.map((e) => {
            const c = scope.customers.find((x) => x.id === e.customerId);
            return [
              c?.name ?? "Unknown",
              c?.whatsapp ?? "Unknown",
              e.type,
              dateOnly(e.createdAt),
              dateTime(e.lastInteractionAt),
              e.status,
              e.followUpRequired ? dateOnly(e.followUpDueAt) : "Not required",
              e.assignedTo,
              e.conversionStatus ?? "Not captured",
            ];
          }),
        ),
    },
    {
      name: "Customer list",
      description: "Customers active in the period with type and captured interests.",
      rows: new Set(scope.enquiries.map((e) => e.customerId)).size,
      run: () => {
        const ids = new Set(scope.enquiries.map((e) => e.customerId));
        downloadCsv(
          `711club-customers-${stamp}`,
          ["Customer", "WhatsApp", "Type", "Interests", "First interaction", "Last interaction"],
          scope.customers
            .filter((c) => ids.has(c.id))
            .map((c) => [
              c.name,
              c.whatsapp,
              customerLabel(c),
              c.interests.join(" / ") || "Not captured",
              dateOnly(c.firstInteractionAt),
              dateTime(c.lastInteractionAt),
            ]),
        );
      },
    },
    {
      name: "Offer performance",
      description: "Reach, enquiries, responses and captured conversions per offer.",
      rows: scope.offers.length,
      run: () =>
        downloadCsv(
          `711club-offer-performance-${stamp}`,
          ["Offer", "Segment", "Sent", "Customers engaged", "Enquiries", "Responses", "Conversions", "Conversion rate"],
          offerPerformance(scope).map((o) => [
            o.name,
            o.segment,
            o.sent,
            o.customersEngaged,
            o.enquiries,
            o.responses,
            o.conversions,
            fmtPct(o.conversionRate),
          ]),
        ),
    },
    {
      name: "WhatsApp engagement summary",
      description: "Headline engagement metrics and response rates for the period.",
      rows: 1,
      run: () =>
        downloadCsv(
          `711club-engagement-summary-${stamp}`,
          ["Metric", "Value"],
          [
            ["Period", `${dateOnly(range.from.toISOString())} – ${dateOnly(range.to.toISOString())}`],
            ["Total customers", fmtInt(cust.total)],
            ["New customers", fmtInt(cust.new)],
            ["Returning customers", fmtInt(cust.returning)],
            ["Unmatched customers", fmtInt(cust.unidentified)],
            ["Conversations", fmtInt(eng.conversations)],
            ["Customer messages", fmtInt(eng.customerMessages)],
            ["AI responses", fmtInt(eng.aiResponses)],
            ["Human responses", fmtInt(eng.humanResponses)],
            ["Escalations", fmtInt(eng.escalations)],
            ["Failed deliveries", fmtInt(eng.failed)],
            ["Customer response rate", fmtPct(eng.customerResponseRate)],
            ["AI response rate", fmtPct(eng.aiResponseRate)],
            ["Escalation rate", fmtPct(eng.escalationRate)],
            ["Completion rate", fmtPct(eng.completionRate)],
            ["Failed delivery rate", fmtPct(eng.failedRate)],
            ["Follow-ups required", fmtInt(pipe.followUps)],
          ],
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Exports always follow the date range and filters currently selected in the header."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((r) => (
          <ChartCard key={r.name} title={r.name} description={r.description}>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileBarChart className="size-4" /> {fmtInt(r.rows)} rows
              </span>
              <Button
                onClick={() => {
                  if (r.rows === 0) {
                    toast.error("No data available for the selected period.");
                    return;
                  }
                  r.run();
                  toast.success(`${r.name} exported.`);
                }}
              >
                <Download className="size-4" /> Export CSV
              </Button>
            </div>
          </ChartCard>
        ))}
      </div>
    </div>
  );
}
