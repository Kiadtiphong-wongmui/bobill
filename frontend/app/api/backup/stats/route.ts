import { proxyBackendJson } from "@/lib/backend-proxy";

/** GET /api/backup/stats — Return record counts per data category */
export async function GET() {
  return proxyBackendJson("/api/backup/stats", { method: "GET" });
}
