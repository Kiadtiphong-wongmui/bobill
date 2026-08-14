import { NextRequest } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET() {
  return proxyBackendJson("/api/users", { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackendJson("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
