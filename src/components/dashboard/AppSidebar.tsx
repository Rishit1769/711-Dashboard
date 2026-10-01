import { Link } from "@tanstack/react-router";
import {
  ChartPie,
  Cog,
  Activity,
  FileBarChart,
  LayoutDashboard,
  MessageSquare,
  Send,
  ShieldAlert,
  Sparkles,
  Tag,
  UsersRound,
  UtensilsCrossed,
  LogOut,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Inbox & operations", icon: LayoutDashboard },
  { to: "/conversations", label: "Conversations", icon: MessageSquare },
  { to: "/enquiries", label: "Enquiries", icon: ChartPie },
  { to: "/follow-ups", label: "Follow-ups", icon: Sparkles },
  { to: "/campaigns", label: "Campaigns", icon: FileBarChart },
  { to: "/offers", label: "Offers", icon: Tag },
  { to: "/buffet", label: "Buffet content", icon: UtensilsCrossed },
  { to: "/knowledge", label: "Knowledge / RAG", icon: Sparkles },
  { to: "/queue", label: "Delivery queue", icon: Send },
  { to: "/alerts", label: "Events & alerts", icon: ShieldAlert },
  { to: "/feedback", label: "Feedback", icon: MessageSquare },
  { to: "/health", label: "Health / ops", icon: Activity },
  { to: "/config", label: "Config", icon: Cog },
  { to: "/staff", label: "Staff & audit", icon: UsersRound },
] as const;

export function SidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          711
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">711 Club</p>
          <p className="text-xs text-sidebar-foreground/60">Operations Analytics</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={onNavigate}
                activeOptions={{ exact: to === "/" }}
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary",
                }}
                inactiveProps={{ className: "border-l-2 border-transparent" }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            RM
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">Ritika Menon</p>
            <p className="text-xs text-sidebar-foreground/60">Manager / Admin</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-3.5" /> Logout
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
      <SidebarContents />
    </aside>
  );
}
