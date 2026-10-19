import { NextRequest } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyBackendJson(`/api/quotations/${id}/convert-to-invoice`, { method: "POST" });
}
