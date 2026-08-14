import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { authConfig, verifySessionToken } from "@/lib/auth";
import AppPageShell from "@/components/layout/app-page-shell";
import BackupClient from "./backup-client";

export const metadata: Metadata = {
  title: "Backup & Restore | Bobill",
  description: "จัดการการสำรองข้อมูล กู้คืนข้อมูล และล้างข้อมูลระบบ",
};

/**
 * Server Component — verifies Admin role before rendering.
 * Non-Admin users are redirected to the dashboard.
 */
export default async function BackupPage() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(authConfig.sessionCookieName)?.value;

  if (!rawToken) redirect("/login?next=/backup");

  const session = await verifySessionToken(rawToken);
  if (!session) redirect("/login?next=/backup");
  if (!session.roles.includes("ADMIN")) redirect("/");

  return (
    <AppPageShell>
      <BackupClient />
    </AppPageShell>
  );
}
