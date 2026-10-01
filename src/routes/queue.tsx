import { createFileRoute } from "@tanstack/react-router";
import { SpecView } from "@/components/dashboard/SpecView";
export const Route = createFileRoute("/queue")({ component: () => <SpecView screenKey="queue" /> });
