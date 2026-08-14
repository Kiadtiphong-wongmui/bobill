import { useEffect, useState } from "react";
import { getInvoiceStats } from "@/lib/invoices/api";
import type { InvoiceStats } from "@/lib/invoices/types";

export function useDashboardStats(year?: number) {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        setLoading(true);
        const data = await getInvoiceStats(year);
        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard stats");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [year]);

  return { stats, loading, error };
}
