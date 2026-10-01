/** The browser-facing contract for the private 711 read/write workflows. */
export type DashboardView = "overview" | "conversations" | "thread" | "enquiries" | "followups" | "campaigns" | "offers" | "buffet" | "knowledge" | "queue" | "alerts" | "feedback" | "health" | "health_deep" | "config" | "staff" | "audit";
export type ActionName = "accept_handoff" | "resolve_handoff" | "return_to_bot" | "send_manual_reply" | "close_enquiry" | "assign_enquiry" | "resolve_event" | "toggle_offer" | "publish_buffet" | "approve_campaign" | "set_campaign_status" | "cancel_followup" | "retry_message" | "cancel_message";
export interface DashboardRequest { view: DashboardView; params?: Record<string, unknown> }
export interface DashboardResponse<T = unknown> { ok: boolean; view?: string; data?: T; page?: { limit: number; offset: number; has_more: boolean }; error?: string }
export interface ActionResponse { ok: boolean; action?: ActionName; request_key?: string; applied_rows?: number; already_applied?: boolean; error?: string }

const baseUrl = (import.meta.env.VITE_N8N_PROXY_URL as string | undefined)?.replace(/\/$/, "");
export async function read711<T>(request: DashboardRequest): Promise<DashboardResponse<T>> {
  if (!baseUrl) return { ok: true, view: request.view, data: undefined as T };
  const response = await fetch(`${baseUrl}/api/711/dashboard`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request), credentials: "include" });
  const payload = (await response.json()) as DashboardResponse<T>;
  if (response.status === 401) window.location.assign("/login");
  return payload;
}
export async function write711(action: ActionName, params: Record<string, unknown>, requestKey: string): Promise<ActionResponse> {
  if (!baseUrl) return { ok: true, action, request_key: requestKey, applied_rows: 1 };
  const response = await fetch(`${baseUrl}/api/711/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, params, request_key: requestKey }), credentials: "include" });
  const payload = (await response.json()) as ActionResponse;
  if (response.status === 401) window.location.assign("/login");
  return payload;
}
