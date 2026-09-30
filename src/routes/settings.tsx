import { createFileRoute } from "@tanstack/react-router";
import { Database, ShieldCheck } from "lucide-react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { PageHeader } from "@/components/dashboard/PageState";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DATE_PRESETS, useAnalytics } from "@/lib/data/filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DatePreset } from "@/lib/data/filters";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Dashboard Settings — 711 Club Admin" },
      {
        name: "description",
        content:
          "Configure the default reporting window, data-integrity rules and notification preferences for the 711 Club dashboard.",
      },
      { property: "og:title", content: "Dashboard Settings — 711 Club" },
      {
        property: "og:description",
        content: "Default reporting window, data integrity rules and alert preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { filters, setFilter } = useAnalytics();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Preferences for how this dashboard reports on 711 Club activity."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Reporting" description="Applies to every page of the dashboard">
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="font-medium">Default date range</span>
                <span className="block text-xs text-muted-foreground">
                  Window used when the dashboard opens
                </span>
              </span>
              <Select
                value={filters.preset}
                onValueChange={(v) => setFilter("preset", v as DatePreset)}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Separator />
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="font-medium">Escalation alerts</span>
                <span className="block text-xs text-muted-foreground">
                  Notify managers when a conversation is escalated
                </span>
              </span>
              <Switch defaultChecked />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="font-medium">Overdue follow-up alerts</span>
                <span className="block text-xs text-muted-foreground">
                  Daily digest of follow-ups past their due date
                </span>
              </span>
              <Switch defaultChecked />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="font-medium">Failed delivery alerts</span>
                <span className="block text-xs text-muted-foreground">
                  Flag WhatsApp messages that did not reach the customer
                </span>
              </span>
              <Switch />
            </label>
          </div>
        </ChartCard>

        <ChartCard title="Data integrity" description="Rules this dashboard follows">
          <ul className="flex flex-col gap-3 text-sm">
            {[
              "Returning customers are counted only where an identity match exists; anything else shows as Unknown.",
              "Conversion and booking figures appear only where the workflow captures the outcome.",
              "Interests and preferences reflect only what customers actually told us.",
              "Failed deliveries come from real WhatsApp delivery status.",
              "AI responses and escalations come from real message and escalation events.",
              "Where a metric cannot be calculated, the dashboard shows N/A instead of estimating.",
            ].map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
                <span className="text-muted-foreground">{rule}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Database className="mt-0.5 size-4 shrink-0" />
            The dashboard reads from a single analytics data layer, so connecting the live WhatsApp /
            TattvaFlow backend requires no changes to these screens.
          </p>
        </ChartCard>
      </div>
    </div>
  );
}
