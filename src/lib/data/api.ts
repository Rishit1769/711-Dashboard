import { getDataset } from "./dataset";
import type { Dataset } from "./types";

/**
 * Data access boundary. Swap these functions for real API / database calls
 * (WhatsApp / TattvaFlow backend) without touching any UI component.
 */
export async function fetchAnalyticsDataset(): Promise<Dataset> {
  await new Promise((r) => setTimeout(r, 450));
  return getDataset();
}

export const datasetQueryOptions = {
  queryKey: ["analytics-dataset"] as const,
  queryFn: fetchAnalyticsDataset,
  staleTime: 60_000,
};
