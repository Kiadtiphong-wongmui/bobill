import { NextRequest } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyBackendJson(`/api/users/${id}`, { method: "GET" });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  return proxyBackendJson(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyBackendJson(`/api/users/${id}`, { method: "DELETE" });
}
