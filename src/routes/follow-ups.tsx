import { createFileRoute } from "@tanstack/react-router";
import { SpecView } from "@/components/dashboard/SpecView";
export const Route = createFileRoute("/follow-ups")({
  component: () => <SpecView screenKey="followups" />,
});
