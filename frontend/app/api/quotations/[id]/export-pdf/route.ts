import { NextRequest } from "next/server";

import { proxyBackendPdf } from "@/lib/backend-proxy";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyBackendPdf(`/api/quotations/${id}/export-pdf`, `quotation-${id}.pdf`);
}
