import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { buildBackendUrl } from "@/lib/backend-api";
import { authConfig, verifySessionToken } from "@/lib/auth";

const noStore: RequestInit = { cache: "no-store" };

/**
 * Retrieves the raw session token from the cookie store.
 * Returns the token string if present and valid, or null otherwise.
 */
async function getSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(authConfig.sessionCookieName)?.value;
    if (!token) return null;
    const session = await verifySessionToken(token);
    return session !== null ? token : null;
  } catch {
    return null;
  }
}

/**
 * Proxies a request to the backend and returns the JSON body with the same status.
 * Forwards the session token as Authorization: Bearer <token> for backend auth.
 */
export async function proxyBackendJson(path: string, init: RequestInit = {}): Promise<NextResponse> {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(buildBackendUrl(path), { ...init, headers, ...noStore });
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Unable to reach backend service." }, { status: 502 });
  }
}

/**
 * Proxies GET for a PDF export: returns binary on success, JSON error body on failure.
 * Forwards the session token as Authorization: Bearer <token> for backend auth.
 */
export async function proxyBackendPdf(path: string, fallbackFilename: string): Promise<NextResponse> {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(buildBackendUrl(path), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      ...noStore,
    });
    if (!response.ok) {
      const payload = await response.json();
      return NextResponse.json(payload, { status: response.status });
    }
    const pdfArrayBuffer = await response.arrayBuffer();
    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": response.headers.get("content-disposition") ?? `attachment; filename="${fallbackFilename}"`,
      },
    });
  } catch {
    return NextResponse.json({ message: "Unable to reach backend service." }, { status: 502 });
  }
}

/**
 * Proxies a binary GET (e.g. uploaded file stream) with optional JSON error from backend.
 * Forwards the session token as Authorization: Bearer <token> for backend auth.
 */
export async function proxyBackendBinaryGet(path: string): Promise<NextResponse> {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(buildBackendUrl(path), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      ...noStore,
    });
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const payload = await response.json();
        return NextResponse.json(payload, { status: response.status });
      }
      return NextResponse.json({ message: "File not found" }, { status: response.status });
    }
    const bytes = await response.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ message: "Unable to reach backend service." }, { status: 502 });
  }
}
