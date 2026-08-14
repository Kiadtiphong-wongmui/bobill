import { NextRequest, NextResponse } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
  }

  const uploadForm = new FormData();
  uploadForm.set("file", file, file.name);

  return proxyBackendJson("/api/uploads/signature", {
    method: "POST",
    body: uploadForm,
  });
}
