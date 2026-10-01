import { createFileRoute } from "@tanstack/react-router";
import { SpecView } from "@/components/dashboard/SpecView";
export const Route = createFileRoute("/offers")({
  component: () => <SpecView screenKey="offers" />,
});
