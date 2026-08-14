import { NextRequest, NextResponse } from "next/server";

import { authConfig, verifySessionToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(authConfig.sessionCookieName)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifySessionToken(token);
  if (!payload?.id || !payload.username || !Array.isArray(payload.roles)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: payload.id,
    username: payload.username,
    roles: payload.roles,
  });
}
