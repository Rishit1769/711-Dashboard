import { Bot, Headset, MessageSquare, ShieldAlert } from "lucide-react";

import { PriorityBadge, StatusBadge } from "./StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  customerLabel,
  customerRollup,
  dateOnly,
  dateTime,
  type Scope,
} from "@/lib/data/analytics";
import type { Enquiry } from "@/lib/data/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Bot;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className="metric-value mt-1 text-lg">{value}</p>
    </div>
  );
}

export function CustomerDetailSheet({
  customerId,
  scope,
  onOpenChange,
}: {
  customerId: string | null;
  scope: Scope;
  onOpenChange: (open: boolean) => void;
}) {
  const customer = scope.customers.find((c) => c.id === customerId) ?? null;
  const roll = customer ? customerRollup(scope, customer) : null;

  return (
    <Sheet open={!!customer} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {customer && roll ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {customer.name}
                <StatusBadge status={customerLabel(customer)} />
              </SheetTitle>
              <SheetDescription>{customer.whatsapp} · WhatsApp</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-8">
              <section>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer information
                </h4>
                <Row label="First interaction" value={dateOnly(customer.firstInteractionAt)} />
                <Row label="Last interaction" value={dateTime(customer.lastInteractionAt)} />
                <Row label="Customer type" value={customerLabel(customer)} />
                <Row
                  label="Interests / preferences"
                  value={
                    customer.interests.length ? (
                      <span className="flex flex-wrap justify-end gap-1">
                        {customer.interests.map((i) => (
                          <StatusBadge key={i} status={i} />
                        ))}
                      </span>
                    ) : (
                      "Not captured"
                    )
                  }
                />
              </section>

              <Separator />

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  WhatsApp conversation summary
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat label="Customer" value={roll.customerMessages} icon={MessageSquare} />
                  <MiniStat label="AI replies" value={roll.aiResponses} icon={Bot} />
                  <MiniStat label="Human" value={roll.humanResponses} icon={Headset} />
                  <MiniStat label="Escalations" value={roll.escalations} icon={ShieldAlert} />
                </div>
              </section>

              <Separator />

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Enquiry history ({roll.enquiries.length})
                </h4>
                <ul className="flex flex-col gap-2">
                  {roll.enquiries.map((e) => (
                    <li key={e.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{e.type} enquiry</span>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{e.lastMessage}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {dateOnly(e.createdAt)} · Assigned to {e.assignedTo}
                      </p>
                    </li>
                  ))}
                  {roll.enquiries.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      No enquiries in the selected period.
                    </li>
                  ) : null}
                </ul>
              </section>

              <Separator />

              <section>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Offer interaction
                </h4>
                <Row label="Promotional messages received" value={roll.offersReceived || "None"} />
                <Row label="Offer-related enquiries" value={roll.offerEnquiries} />
                <Row
                  label="Conversion status"
                  value={
                    roll.enquiries.find((e) => e.conversionStatus === "Booked")
                      ? "Booked"
                      : (roll.enquiries.find((e) => e.conversionStatus)?.conversionStatus ??
                        "Not captured")
                  }
                />
              </section>

              <Separator />

              <section>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Follow-up
                </h4>
                {roll.followUps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No follow-up required.</p>
                ) : (
                  roll.followUps.map((f) => (
                    <div key={f.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{f.type}</span>
                        <PriorityBadge priority={f.priority} />
                      </div>
                      <Row label="Follow-up due" value={dateOnly(f.followUpDueAt)} />
                      <Row label="Status" value={<StatusBadge status={f.status} />} />
                      <Row label="Assigned staff" value={f.assignedTo} />
                    </div>
                  ))
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function EnquiryDetailSheet({
  enquiry,
  scope,
  onOpenChange,
}: {
  enquiry: Enquiry | null;
  scope: Scope;
  onOpenChange: (open: boolean) => void;
}) {
  const customer = enquiry ? scope.customers.find((c) => c.id === enquiry.customerId) : null;
  const thread = enquiry
    ? scope.messages
        .filter((m) => m.enquiryId === enquiry.id && !m.promotional)
        .sort((a, b) => a.at.localeCompare(b.at))
    : [];

  return (
    <Sheet open={!!enquiry} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {enquiry ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {enquiry.type} enquiry
                <StatusBadge status={enquiry.status} />
              </SheetTitle>
              <SheetDescription>
                {customer?.name ?? "Unknown customer"} · {customer?.whatsapp ?? "Unknown"}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-8">
              <section>
                <Row label="Enquiry date" value={dateTime(enquiry.createdAt)} />
                <Row label="Last interaction" value={dateTime(enquiry.lastInteractionAt)} />
                <Row label="Assigned to" value={enquiry.assignedTo} />
                <Row label="Priority" value={<PriorityBadge priority={enquiry.priority} />} />
                <Row label="Follow-up required" value={enquiry.followUpRequired ? "Yes" : "No"} />
                <Row label="Follow-up due" value={dateOnly(enquiry.followUpDueAt)} />
                <Row label="Room type" value={enquiry.roomType ?? "Not captured"} />
                <Row label="Service category" value={enquiry.serviceCategory ?? "Not captured"} />
                <Row label="Requested buffet date" value={dateOnly(enquiry.buffetDate)} />
                <Row label="Guests" value={enquiry.guests ?? "Not captured"} />
                <Row
                  label="Conversion status"
                  value={enquiry.conversionStatus ?? "Not captured"}
                />
                <Row label="Source" value="WhatsApp" />
              </section>

              <Separator />

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conversation
                </h4>
                <ul className="flex flex-col gap-2">
                  {thread.map((m) => (
                    <li
                      key={m.id}
                      className={
                        m.author === "customer"
                          ? "max-w-[85%] rounded-lg rounded-bl-none border border-border bg-secondary/60 p-3"
                          : "ml-auto max-w-[85%] rounded-lg rounded-br-none border border-primary/20 bg-primary/8 p-3"
                      }
                    >
                      <p className="text-sm">{m.text}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {m.author === "customer"
                          ? "Customer"
                          : m.author === "ai"
                            ? "AI assistant"
                            : "Team member"}{" "}
                        · {dateTime(m.at)}
                        {m.delivery === "failed" ? " · delivery failed" : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
