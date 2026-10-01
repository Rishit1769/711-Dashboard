import { createFileRoute } from "@tanstack/react-router";
import { SpecView } from "@/components/dashboard/SpecView";
export const Route = createFileRoute("/feedback")({ component: () => <SpecView screenKey="feedback" /> });
