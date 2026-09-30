import type {
  Customer,
  Dataset,
  Enquiry,
  EnquiryStatus,
  EnquiryType,
  Message,
} from "./types";

export interface Scope {
  from: Date;
  to: Date;
  customers: Customer[];
  enquiries: Enquiry[];
  messages: Message[];
  offers: Dataset["offers"];
  staff: string[];
}

export const fmtInt = (n: number) => n.toLocaleString("en-IN");
export const fmtPct = (n: number | null, digits = 1) =>
  n === null || Number.isNaN(n) ? "N/A" : `${n.toFixed(digits)}%`;

export function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export function shortDate(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function dateOnly(iso: string | null) {
  if (!iso) return "Not captured";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function eachDay(from: Date, to: Date) {
  const out: string[] = [];
  const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  while (cur <= to) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/* ---------------------------------- KPIs --------------------------------- */

export function customerMetrics(scope: Scope) {
  const ids = new Set(scope.enquiries.map((e) => e.customerId));
  const inScope = scope.customers.filter((c) => ids.has(c.id));
  const isNew = (c: Customer) =>
    new Date(c.firstInteractionAt) >= scope.from && new Date(c.firstInteractionAt) <= scope.to;
  // new + returning + unidentified always sums to total: a contact is either
  // matched and first seen in this period, matched and seen before, or unmatched.
  const matched = inScope.filter((c) => c.isReturning !== null);
  return {
    total: inScope.length,
    new: matched.filter(isNew).length,
    returning: matched.filter((c) => !isNew(c)).length,
    unidentified: inScope.filter((c) => c.isReturning === null).length,
    uniqueOnWhatsApp: new Set(scope.messages.map((m) => m.customerId)).size,
  };

}

export function engagementMetrics(scope: Scope) {
  const customerMessages = scope.messages.filter((m) => m.author === "customer").length;
  const aiResponses = scope.messages.filter((m) => m.author === "ai" && !m.promotional).length;
  const humanResponses = scope.messages.filter((m) => m.author === "human").length;
  const escalations = scope.messages.filter((m) => m.escalation).length;
  const outbound = scope.messages.filter((m) => m.author !== "customer");
  const failed = outbound.filter((m) => m.delivery === "failed").length;
  const conversations = scope.enquiries.length;
  const respondingCustomers = new Set(
    scope.messages.filter((m) => m.author === "customer").map((m) => m.enquiryId),
  ).size;
  const multiTurn = new Map<string, number>();
  scope.messages
    .filter((m) => m.author === "customer")
    .forEach((m) => multiTurn.set(m.enquiryId, (multiTurn.get(m.enquiryId) ?? 0) + 1));
  const interactive = [...multiTurn.values()].filter((n) => n > 1).length;
  const completed = scope.enquiries.filter(
    (e) => e.status === "Closed" || e.status === "Converted",
  ).length;

  return {
    conversations,
    customerMessages,
    aiResponses,
    humanResponses,
    escalations,
    failed,
    outbound: outbound.length,
    customerResponseRate: conversations ? (respondingCustomers / conversations) * 100 : null,
    customerInteractionRate: conversations ? (interactive / conversations) * 100 : null,
    aiResponseRate: customerMessages ? (aiResponses / customerMessages) * 100 : null,
    escalationRate: conversations ? (escalations / conversations) * 100 : null,
    completionRate: conversations ? (completed / conversations) * 100 : null,
    failedRate: outbound.length ? (failed / outbound.length) * 100 : null,
  };
}

export function pipelineMetrics(scope: Scope) {
  const by = (s: EnquiryStatus) => scope.enquiries.filter((e) => e.status === s).length;
  return {
    New: by("New"),
    "Follow-up Required": by("Follow-up Required"),
    Pending: by("Pending"),
    Escalated: by("Escalated"),
    Closed: by("Closed"),
    Converted: by("Converted"),
    followUps: scope.enquiries.filter((e) => e.followUpRequired).length,
  };
}

/* -------------------------------- Breakdowns ------------------------------ */

export function countBy<T>(items: T[], key: (item: T) => string | null) {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const k = key(i);
    if (!k) return;
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function enquiryTypeBreakdown(scope: Scope) {
  return countBy(scope.enquiries, (e) => e.type);
}

export function interestBreakdown(scope: Scope) {
  const ids = new Set(scope.enquiries.map((e) => e.customerId));
  const inScope = scope.customers.filter((c) => ids.has(c.id));
  const map = new Map<string, number>();
  inScope.forEach((c) => c.interests.forEach((i) => map.set(i, (map.get(i) ?? 0) + 1)));
  const total = inScope.length || 1;
  return [...map.entries()]
    .map(([name, value]) => ({ name, value, pct: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value);
}

export function engagementSeries(scope: Scope) {
  const days = eachDay(scope.from, scope.to);
  const base = new Map(
    days.map((d) => [
      d,
      { date: d, label: shortDate(d), customer: 0, ai: 0, human: 0, escalations: 0, total: 0 },
    ]),
  );
  scope.messages.forEach((m) => {
    const row = base.get(dayKey(m.at));
    if (!row) return;
    if (m.author === "customer") row.customer += 1;
    else if (m.author === "ai") row.ai += 1;
    else row.human += 1;
    if (m.escalation) row.escalations += 1;
    row.total += 1;
  });
  return [...base.values()];
}

export function enquirySeries(scope: Scope, filter?: (e: Enquiry) => boolean) {
  const days = eachDay(scope.from, scope.to);
  const base = new Map(days.map((d) => [d, { date: d, label: shortDate(d), value: 0 }]));
  scope.enquiries.filter((e) => (filter ? filter(e) : true)).forEach((e) => {
    const row = base.get(dayKey(e.createdAt));
    if (row) row.value += 1;
  });
  return [...base.values()];
}

export function weeklyBuckets(rows: { date: string; value: number }[]) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = new Date(`${r.date}T00:00:00Z`);
    const dow = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - ((dow + 6) % 7));
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + r.value);
  });
  return [...map.entries()].map(([date, value]) => ({ date, label: `w/c ${shortDate(date)}`, value }));
}

export function monthlyBuckets(rows: { date: string; value: number }[]) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const key = r.date.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + r.value);
  });
  return [...map.entries()].map(([date, value]) => ({
    date,
    label: new Date(`${date}-01T00:00:00Z`).toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }),
    value,
  }));
}

/* ---------------------------------- Offers -------------------------------- */

export interface OfferPerformance {
  id: string;
  name: string;
  segment: string;
  sent: number;
  customersEngaged: number;
  enquiries: number;
  responses: number;
  conversions: number;
  conversionRate: number | null;
}

export function offerPerformance(scope: Scope): OfferPerformance[] {
  return scope.offers.map((offer) => {
    const promos = scope.messages.filter((m) => m.promotional && m.offerId === offer.id);
    const related = scope.enquiries.filter((e) => e.offerId === offer.id);
    const responses = scope.messages.filter(
      (m) => m.author === "customer" && related.some((e) => e.id === m.enquiryId),
    ).length;
    const conversions = related.filter((e) => e.conversionStatus === "Booked").length;
    return {
      id: offer.id,
      name: offer.name,
      segment: offer.segment,
      sent: promos.length,
      customersEngaged: new Set(related.map((e) => e.customerId)).size,
      enquiries: related.length,
      responses,
      conversions,
      conversionRate: related.length ? (conversions / related.length) * 100 : null,
    };
  }).sort((a, b) => b.enquiries - a.enquiries);
}

export function conversionBreakdown(scope: Scope, filter?: (e: Enquiry) => boolean) {
  const rows = scope.enquiries.filter((e) => (filter ? filter(e) : true));
  const labels = ["Interested", "Enquiry", "Follow-up", "Booked", "Not Converted"];
  const out = labels.map((name) => ({
    name,
    value: rows.filter((e) => e.conversionStatus === name).length,
  }));
  out.push({ name: "Not captured", value: rows.filter((e) => e.conversionStatus === null).length });
  return out.filter((r) => r.value > 0);
}

/* --------------------------------- Buffet -------------------------------- */

export function guestBuckets(rows: Enquiry[]) {
  const buckets = [
    { name: "1–2 guests", test: (g: number) => g <= 2 },
    { name: "3–5 guests", test: (g: number) => g >= 3 && g <= 5 },
    { name: "6–10 guests", test: (g: number) => g >= 6 && g <= 10 },
    { name: "11–20 guests", test: (g: number) => g >= 11 && g <= 20 },
    { name: "20+ guests", test: (g: number) => g > 20 },
  ];
  return buckets.map((b) => ({
    name: b.name,
    value: rows.filter((e) => e.guests !== null && b.test(e.guests)).length,
  }));
}

/* ------------------------------- Customers ------------------------------- */

export function customerRollup(scope: Scope, customer: Customer) {
  const enquiries = scope.enquiries.filter((e) => e.customerId === customer.id);
  const messages = scope.messages.filter((m) => m.customerId === customer.id);
  return {
    enquiries,
    messages,
    customerMessages: messages.filter((m) => m.author === "customer").length,
    aiResponses: messages.filter((m) => m.author === "ai" && !m.promotional).length,
    humanResponses: messages.filter((m) => m.author === "human").length,
    escalations: messages.filter((m) => m.escalation).length,
    offersReceived: new Set(messages.filter((m) => m.promotional).map((m) => m.offerId)).size,
    offerEnquiries: enquiries.filter((e) => e.offerId).length,
    followUps: enquiries.filter((e) => e.followUpRequired),
  };
}

export function customerLabel(c: Customer) {
  if (c.isReturning === null) return "Unknown";
  return c.isReturning ? "Returning" : "New";
}

export const typeOf = (e: Enquiry): EnquiryType => e.type;
