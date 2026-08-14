import { headers } from "next/headers";
import type { EmployeeCard } from "@/lib/employee-cards/types";
import CardEditorServerWrapper from "./card-editor-server-wrapper";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditEmployeeCardPage({ params }: Props) {
  const { id } = await params;
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const cookie = requestHeaders.get("cookie") ?? "";
  if (!host) {
    throw new Error("Unable to resolve request host");
  }

  const response = await fetch(`${protocol}://${host}/api/employee-cards/${Number(id)}`, {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });
  if (!response.ok) {
    throw new Error("Unable to load employee card");
  }
  const card = (await response.json()) as EmployeeCard;

  return <CardEditorServerWrapper card={card} />;
}
