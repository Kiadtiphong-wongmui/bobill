import { NextRequest, NextResponse } from "next/server";

import { createSessionToken, authConfig } from "@/lib/auth";
import { buildBackendUrl } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(buildBackendUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      message?: string;
      id?: number;
      username?: string;
      roles?: string[];
    };

    if (!response.ok || !payload.id || !payload.username || !Array.isArray(payload.roles)) {
      return NextResponse.json(
        { message: payload.message ?? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: response.status },
      );
    }

    const token = await createSessionToken({
      id: payload.id,
      username: payload.username,
      roles: payload.roles,
    });

    const nextResponse = NextResponse.json(
      {
        id: payload.id,
        username: payload.username,
        roles: payload.roles,
      },
      { status: 200 },
    );
    nextResponse.cookies.set(authConfig.sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: authConfig.sessionMaxAgeSeconds,
    });
    return nextResponse;
  } catch {
    return NextResponse.json({ message: "Unable to reach backend service." }, { status: 502 });
  }
}
