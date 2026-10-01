import { createFileRoute } from "@tanstack/react-router";
import { SpecView } from "@/components/dashboard/SpecView";
export const Route = createFileRoute("/knowledge")({
  component: () => <SpecView screenKey="knowledge" />,
});
