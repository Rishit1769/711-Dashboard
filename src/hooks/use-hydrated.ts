import { useEffect, useState } from "react";

/** True only after client hydration — use to gate browser-only rendering. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
