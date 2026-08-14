import { proxyBackendJson } from "@/lib/backend-proxy";

/** GET /api/backup/snapshots — List all snapshots */
export async function GET() {
  return proxyBackendJson("/api/backup/snapshots", { method: "GET" });
}

/** POST /api/backup/snapshots — Create a new backup (JSON + SQL) */
export async function POST() {
  return proxyBackendJson("/api/backup/snapshot", { method: "POST" });
}
