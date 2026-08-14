import { NextRequest, NextResponse } from "next/server";

import { buildBackendUrl } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(buildBackendUrl("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Unable to reach backend service." }, { status: 502 });
  }
}
