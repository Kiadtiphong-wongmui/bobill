import { NextRequest, NextResponse } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyBackendJson(`/api/invoices/${id}`, { method: "GET" });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  return proxyBackendJson(`/api/invoices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyBackendJson(`/api/invoices/${id}`, { method: "DELETE" });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const action = request.nextUrl.searchParams.get("action");
  if (action === "issue") {
    return proxyBackendJson(`/api/invoices/${id}/issue`, { method: "PATCH" });
  }

  return NextResponse.json({ message: "Unsupported patch action" }, { status: 400 });
}
