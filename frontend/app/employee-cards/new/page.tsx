"use client";

import AppPageShell from "@/components/layout/app-page-shell";
import CardEditorForm from "../card-editor-form";
import { createEmployeeCard } from "@/lib/employee-cards/api";
import type { EmployeeCardInput } from "@/lib/employee-cards/types";

export default function NewEmployeeCardPage() {
  const handleCreate = async (data: EmployeeCardInput) => {
    await createEmployeeCard(data);
  };

  return (
    <AppPageShell wide>
      <CardEditorForm
        title="สร้างบัตรพนักงานใหม่"
        submitLabel="สร้างบัตรพนักงาน"
        onSubmit={handleCreate}
      />
    </AppPageShell>
  );
}
