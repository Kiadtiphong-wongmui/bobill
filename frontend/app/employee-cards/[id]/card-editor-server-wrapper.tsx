"use client";

import CardEditorForm from "../card-editor-form";
import { updateEmployeeCard } from "@/lib/employee-cards/api";
import type { EmployeeCard, EmployeeCardInput } from "@/lib/employee-cards/types";
import AppPageShell from "@/components/layout/app-page-shell";

export default function CardEditorServerWrapper({ card }: { card: EmployeeCard }) {
  const handleUpdate = async (data: EmployeeCardInput) => {
    await updateEmployeeCard(card.id, data);
  };

  return (
    <AppPageShell wide>
      <CardEditorForm
        title={`แก้ไขบัตรพนักงาน: ${card.name}`}
        submitLabel="บันทึกการแก้ไข"
        initialData={card}
        onSubmit={handleUpdate}
      />
    </AppPageShell>
  );
}
