import { useRouterState } from "@tanstack/react-router";
import { Bell, Download, Menu, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SidebarContents } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { dateOnly } from "@/lib/data/analytics";
import { DATE_PRESETS, useAnalytics, type DatePreset } from "@/lib/data/filters";
import { ENQUIRY_STATUSES, ENQUIRY_TYPES } from "@/lib/data/types";
import { downloadCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "/": "711 Club — Admin Dashboard",
  "/customers": "Customers",
  "/conversations": "WhatsApp Conversations",
  "/enquiries": "Enquiries & Pipeline",
  "/offers": "Offer Analytics",
  "/buffet": "Weekly Buffet Analytics",
  "/rooms": "Room & Hotel Enquiry Analytics",
  "/follow-ups": "Follow-up Queue",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function TopHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { filters, setFilter, resetFilters, activeFilterCount, range, scope, refetch, isRefreshing } =
    useAnalytics();
  const [showFilters, setShowFilters] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const title = TITLES[pathname] ?? "711 Club — Admin Dashboard";

  const exportCurrent = () => {
    if (!scope || scope.enquiries.length === 0) {
      toast.error("Nothing to export for the current filters.");
      return;
    }
    downloadCsv(
      `711club-enquiries-${range.from.toISOString().slice(0, 10)}`,
      ["Enquiry ID", "Customer", "WhatsApp", "Type", "Created", "Status", "Follow-up", "Assigned to"],
      scope.enquiries.map((e) => {
        const c = scope.customers.find((x) => x.id === e.customerId);
        return [
          e.id,
          c?.name ?? "Unknown",
          c?.whatsapp ?? "Unknown",
          e.type,
          dateOnly(e.createdAt),
          e.status,
          e.followUpRequired ? "Yes" : "No",
          e.assignedTo,
        ];
      }),
    );
    toast.success(`Exported ${scope.enquiries.length} filtered enquiries.`);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Sheet open={mobileNav} onOpenChange={setMobileNav}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-0 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContents onNavigate={() => setMobileNav(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
          <p className="text-xs text-muted-foreground">
            {dateOnly(range.from.toISOString())} – {dateOnly(range.to.toISOString())} · WhatsApp channel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.preset}
            onValueChange={(v) => setFilter("preset", v as DatePreset)}
          >
            <SelectTrigger className="h-9 w-[9.5rem]">
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

          <Button
            variant={showFilters || activeFilterCount ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters((s) => !s)}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount ? <span className="tabular">{activeFilterCount}</span> : null}
          </Button>

          <Button variant="outline" size="icon" onClick={refetch} aria-label="Refresh data">
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button variant="outline" size="icon" onClick={exportCurrent} aria-label="Export data">
            <Download className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
          </Button>
          <span className="hidden size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:flex">
            RM
          </span>
        </div>
      </div>

      {showFilters ? (
        <div className="flex flex-wrap items-end gap-3 border-t border-border bg-secondary/40 px-4 py-3 sm:px-6">
          {filters.preset === "custom" ? (
            <>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                From
                <Input
                  type="date"
                  className="h-9 w-40 bg-background"
                  value={filters.customFrom}
                  onChange={(e) => setFilter("customFrom", e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                To
                <Input
                  type="date"
                  className="h-9 w-40 bg-background"
                  value={filters.customTo}
                  onChange={(e) => setFilter("customTo", e.target.value)}
                />
              </label>
            </>
          ) : null}

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Enquiry type
            <Select value={filters.type} onValueChange={(v) => setFilter("type", v as never)}>
              <SelectTrigger className="h-9 w-40 bg-background">
                <SelectValue />
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
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Status
            <Select value={filters.status} onValueChange={(v) => setFilter("status", v as never)}>
              <SelectTrigger className="h-9 w-44 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ENQUIRY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Customer
            <Select value={filters.customer} onValueChange={(v) => setFilter("customer", v as never)}>
              <SelectTrigger className="h-9 w-40 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="returning">Returning</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Channel
            <Select value="whatsapp" onValueChange={() => undefined}>
              <SelectTrigger className="h-9 w-36 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="size-4" /> Clear filters
          </Button>
        </div>
      ) : null}
    </header>
  );
}
