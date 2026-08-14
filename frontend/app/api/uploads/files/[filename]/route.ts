import { NextRequest } from "next/server";

import { proxyBackendBinaryGet } from "@/lib/backend-proxy";

type Params = {
  params: Promise<{ filename: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const { filename } = await params;
  const safeFilename = encodeURIComponent(filename);
  return proxyBackendBinaryGet(`/uploads/${safeFilename}`);
}
