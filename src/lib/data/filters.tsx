import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { datasetQueryOptions } from "./api";
import { REFERENCE_NOW } from "./dataset";
import type { Scope } from "./analytics";
import type { Dataset, EnquiryStatus, EnquiryType } from "./types";

export type DatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "month"
  | "last90"
  | "custom";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "month", label: "This Month" },
  { value: "last90", label: "Last 90 Days" },
  { value: "custom", label: "Custom Range" },
];

export type CustomerFilter = "all" | "new" | "returning";

export interface Filters {
  preset: DatePreset;
  customFrom: string;
  customTo: string;
  type: EnquiryType | "all";
  status: EnquiryStatus | "all";
  customer: CustomerFilter;
  channel: "whatsapp";
}

const DEFAULT_FILTERS: Filters = {
  preset: "last30",
  customFrom: new Date(REFERENCE_NOW.getTime() - 29 * 86400000).toISOString().slice(0, 10),
  customTo: REFERENCE_NOW.toISOString().slice(0, 10),
  type: "all",
  status: "all",
  customer: "all",
  channel: "whatsapp",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

export function resolveRange(f: Filters): { from: Date; to: Date; label: string } {
  const now = REFERENCE_NOW;
  const label = DATE_PRESETS.find((p) => p.value === f.preset)?.label ?? "";
  switch (f.preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now), label };
    case "yesterday": {
      const y = new Date(now.getTime() - 86400000);
      return { from: startOfDay(y), to: endOfDay(y), label };
    }
    case "last7":
      return { from: startOfDay(new Date(now.getTime() - 6 * 86400000)), to: endOfDay(now), label };
    case "last30":
      return { from: startOfDay(new Date(now.getTime() - 29 * 86400000)), to: endOfDay(now), label };
    case "last90":
      return { from: startOfDay(new Date(now.getTime() - 89 * 86400000)), to: endOfDay(now), label };
    case "month":
      return {
        from: startOfDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))),
        to: endOfDay(now),
        label,
      };
    case "custom":
    default:
      return {
        from: startOfDay(new Date(`${f.customFrom}T00:00:00Z`)),
        to: endOfDay(new Date(`${f.customTo}T00:00:00Z`)),
        label,
      };
  }
}

function buildScope(dataset: Dataset, from: Date, to: Date, f: Filters): Scope {
  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= from.getTime() && t <= to.getTime();
  };
  const customerIsNew = (id: string) => {
    const c = dataset.customers.find((x) => x.id === id);
    return c ? inRange(c.firstInteractionAt) : false;
  };
  const customerIsReturning = (id: string) =>
    dataset.customers.find((x) => x.id === id)?.isReturning === true;

  const enquiries = dataset.enquiries.filter((e) => {
    if (!inRange(e.createdAt)) return false;
    if (f.type !== "all" && e.type !== f.type) return false;
    if (f.status !== "all" && e.status !== f.status) return false;
    if (f.customer === "new" && !customerIsNew(e.customerId)) return false;
    if (f.customer === "returning" && !customerIsReturning(e.customerId)) return false;
    return true;
  });
  const enquiryIds = new Set(enquiries.map((e) => e.id));
  const messages = dataset.messages.filter((m) => enquiryIds.has(m.enquiryId) && inRange(m.at));

  return {
    from,
    to,
    customers: dataset.customers,
    enquiries,
    messages,
    offers: dataset.offers,
    staff: dataset.staff,
  };
}

interface AnalyticsContextValue {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  range: { from: Date; to: Date; label: string };
  scope: Scope | null;
  previousScope: Scope | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  isRefreshing: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const query = useQuery(datasetQueryOptions);

  const range = useMemo(() => resolveRange(filters), [filters]);

  const { scope, previousScope } = useMemo(() => {
    if (!query.data) return { scope: null, previousScope: null };
    const span = range.to.getTime() - range.from.getTime();
    const prevTo = new Date(range.from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - span);
    return {
      scope: buildScope(query.data, range.from, range.to, filters),
      previousScope: buildScope(query.data, prevFrom, prevTo, filters),
    };
  }, [query.data, range, filters]);

  const activeFilterCount =
    (filters.type !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.customer !== "all" ? 1 : 0);

  const value: AnalyticsContextValue = {
    filters,
    setFilter: (key, val) => setFilters((prev) => ({ ...prev, [key]: val })),
    resetFilters: () => setFilters(DEFAULT_FILTERS),
    activeFilterCount,
    range,
    scope,
    previousScope,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
    isRefreshing: query.isFetching && !query.isPending,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used inside AnalyticsProvider");
  return ctx;
}
