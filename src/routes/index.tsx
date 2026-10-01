import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bot,
  Clock3,
  FileWarning,
  Inbox,
  PauseCircle,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { read711, write711 } from "@/lib/api/711-api";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "711 Club — Inbox" }] }),
  component: InboxPage,
});

function InboxPage() {
  const [q, setQ] = useState("");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [reply, setReply] = useState("");
  useEffect(() => {
    let live = true;
    void read711({ view: "conversations", params: { limit: 50, offset: 0, q } })
      .then((result) => {
        if (live) setConnected(result.data !== undefined);
      })
      .catch(() => {
        if (live) setConnected(false);
      });
    return () => {
      live = false;
    };
  }, [q]);
  const send = async () => {
    const result = await write711(
      "send_manual_reply",
      { conversation_id: "", body: reply },
      crypto.randomUUID(),
    );
    if (!result.ok) setConnected(false);
    setReply("");
  };
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">
              Inbox · refresh target 5s · Asia/Kolkata
            </span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">Inbox</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversations that need a human decision, with the bot’s exact pause reason.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? "default" : "outline"}>
            {connected ? "Read API connected" : "Waiting for private read API"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw /> Refresh
          </Button>
        </div>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Needs human", icon: Inbox },
          { label: "Due follow-ups", icon: Clock3 },
          { label: "Queue depth", icon: Send },
          { label: "Open alerts", icon: ShieldAlert },
        ].map(({ label, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="metric-value mt-1 text-3xl">—</p>
                <p className="mt-1 text-xs text-muted-foreground">Awaiting read API data</p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary">
                <Icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </section>
      <div className="grid min-h-[560px] gap-4 xl:grid-cols-[360px_1fr_300px]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Conversation list</CardTitle>
              <Badge variant="outline">live</Badge>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="pl-9"
                placeholder="Search q…"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] text-primary-foreground">
                needs human
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                unassigned
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                longest waiting
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                failed delivery
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <FileWarning className="size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">No conversation data loaded</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                The browser never queries MySQL directly. Configure the server proxy, authenticate a
                staff session, and this list will populate from the read workflow.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex min-h-[560px] flex-col">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-base">Thread</CardTitle>
            <p className="text-xs text-muted-foreground">
              Select a conversation to inspect messages and delivery state.
            </p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <Bot className="size-9 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No thread selected</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Message history will show content_type, status, provider_ref, errors, and the joined
              outbound_queue row here.
            </p>
            <div className="mt-5 w-full max-w-md rounded-lg border border-dashed p-4 text-left text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <PauseCircle className="size-4" /> Bot-paused reason
              </div>
              <p className="mt-2">
                Exact workflow gate appears here: handoff_already_open, human_owns_conversation,
                contact_opted_out, rate_limited, or empty_message.
              </p>
            </div>
          </CardContent>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Write a manual reply…"
                className="min-h-10 resize-none"
                disabled={!connected}
              />
              <Button
                size="icon"
                disabled={!connected || !reply.trim()}
                onClick={() => void send()}
              >
                <Send />
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Manual replies enqueue work; they do not send WhatsApp directly. Success waits for the
              workflow response.
            </p>
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Customer rail</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserRound className="size-4" /> Customer details appear after selection.
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <span>
                  language
                  <br />
                  <strong className="text-foreground">—</strong>
                </span>
                <span>
                  consent
                  <br />
                  <strong className="text-foreground">—</strong>
                </span>
                <span>
                  DND
                  <br />
                  <strong className="text-foreground">—</strong>
                </span>
                <span>
                  interactions
                  <br />
                  <strong className="text-foreground">—</strong>
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex gap-2 text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p className="text-xs leading-relaxed">
                  <strong>No invented facts.</strong> Pending client input renders as not confirmed;
                  rates, hours and policy are never filled with sample copy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
