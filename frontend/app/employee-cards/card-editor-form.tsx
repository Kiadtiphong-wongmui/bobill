"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { appControlClass, appBtnPrimaryClass, appBtnSecondaryClass, appCardClass } from "@/components/layout/app-page-shell";
import type { EmployeeCardInput } from "@/lib/employee-cards/types";
import { getDisplayPhotoUrl } from "@/lib/employee-cards/api";

interface CardEditorFormProps {
  initialData?: EmployeeCardInput;
  onSubmit: (data: EmployeeCardInput) => Promise<void>;
  title: string;
  submitLabel: string;
}

const DEFAULT_INSTRUCTIONS = 
`๑. ติดบัตรประจำตัวพนักงานขายของหน้าร้านตลอดระยะเวลาการทำงาน
๒. พร้อมแสดงใบอนุญาตทำงาน ต่อพนักงานเจ้าหน้าที่ขณะเข้าทำการตรวจสอบ`;

// Helper to format date string (YYYY-MM-DD) into Thai short date (e.g. 13 ก.พ. 68)
const formatThaiPreviewDate = (dateStr: string): string => {
  if (!dateStr) return "....................";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "....................";
    const day = date.getDate();
    const months = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];
    const month = months[date.getMonth()];
    const year = (date.getFullYear() + 543) % 100;
    return `${day} ${month} ${year}`;
  } catch {
    return "....................";
  }
};

export default function CardEditorForm({
  initialData,
  onSubmit,
  title,
  submitLabel,
}: CardEditorFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<EmployeeCardInput>({
    cardHeader: "พนักงานขายของหน้าร้าน (คนต่างด้าว)",
    photoUrl: "",
    name: "",
    nationality: "",
    workPermitNo: "",
    instructions: DEFAULT_INSTRUCTIONS,
    employerName: "",
    address: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0],
    signerName: "",
    signerPosition: "นายจ้าง",
    telephone: "",
  });

  const [prevInitialData, setPrevInitialData] = useState<EmployeeCardInput | undefined>(undefined);
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      const formatToYmd = (dateVal: string | Date) => {
        if (!dateVal) return "";
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
      };
      setForm({
        ...initialData,
        issueDate: formatToYmd(initialData.issueDate),
        expiryDate: formatToYmd(initialData.expiryDate),
      });
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploads/signature", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("อัปโหลดรูปภาพไม่สำเร็จ");
      }

      const result = await response.json();
      setForm((prev) => ({ ...prev, photoUrl: result.path }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate
      if (!form.name.trim()) throw new Error("กรุณากรอกชื่อ-นามสกุล");
      if (!form.nationality.trim()) throw new Error("กรุณากรอกสัญชาติ");
      if (!form.workPermitNo.trim()) throw new Error("กรุณากรอกเลขที่ใบอนุญาตทำงาน");
      if (!form.employerName.trim()) throw new Error("กรุณากรอกชื่อนายจ้าง");
      if (!form.address.trim()) throw new Error("กรุณากรอกที่อยู่สถานประกอบการ");
      if (!form.issueDate) throw new Error("กรุณาระบุวันออกบัตร");
      if (!form.expiryDate) throw new Error("กรุณาระบุวันหมดอายุ");
      if (!form.signerName.trim()) throw new Error("กรุณากรอกชื่อผู้ลงนามออกบัตร");

      await onSubmit(form);
      router.push("/employee-cards");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Form Editor */}
      <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
        <div className={`${appCardClass} space-y-6 border-l-4 border-l-indigo-600`}>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
            <p className="text-xs text-zinc-500">กรอกข้อมูลพนักงานและนายจ้างเพื่อสร้างบัตรพนักงาน</p>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* ด้านหน้าบัตร */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-b pb-1 dark:border-zinc-800">
              ข้อมูลหน้าบัตร
            </h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                หัวข้อบัตร <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="cardHeader"
                value={form.cardHeader}
                onChange={handleChange}
                className={appControlClass}
                placeholder="ระบุหัวข้อบัตร (เช่น พนักงานขายของหน้าร้าน (คนต่างด้าว))"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  รูปถ่ายพนักงาน (ขนาดไม่เกิน 2MB)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="employee-photo-upload"
                  />
                  <label
                    htmlFor="employee-photo-upload"
                    className={`${appBtnSecondaryClass} cursor-pointer py-2 text-xs`}
                  >
                    {isUploading ? "กำลังอัปโหลด..." : form.photoUrl ? "เปลี่ยนรูปภาพ" : "อัปโหลดรูปภาพ"}
                  </label>
                  {form.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, photoUrl: "" }))}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      ลบรูป
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={appControlClass}
                  placeholder="ระบุชื่อและนามสกุลพนักงาน"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  สัญชาติ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  className={appControlClass}
                  placeholder="ระบุสัญชาติพนักงาน "
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  เลขที่ใบอนุญาตทำงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="workPermitNo"
                  value={form.workPermitNo}
                  onChange={handleChange}
                  className={appControlClass}
                  placeholder="ระบุเลขที่ใบอนุญาตทำงาน (13 หลัก)"
                  required
                />
              </div>
            </div>
          </div>

          {/* ด้านหลังบัตร */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-b pb-1 dark:border-zinc-800">
              ข้อมูลหลังบัตร
            </h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                คำแนะนำหลังบัตร (แยกแต่ละบรรทัด) <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="instructions"
                value={form.instructions}
                onChange={handleChange}
                rows={3}
                className={`${appControlClass} resize-none`}
                placeholder="ระบุคำแนะนำการใช้งานบัตรประจำตัวพนักงาน..."
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  ชื่อนายจ้าง/สถานประกอบการ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="employerName"
                  value={form.employerName}
                  onChange={handleChange}
                  className={appControlClass}
                  placeholder="ระบุชื่อนายจ้างหรือบริษัทผู้ว่าจ้าง"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  โทรศัพท์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  className={appControlClass}
                  placeholder="ระบุเบอร์โทรศัพท์ติดต่อ (10 หลัก)"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                ตั้งอยู่เลขที่ (ที่อยู่สถานประกอบการ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className={appControlClass}
                placeholder="ระบุที่อยู่หรือตั้งอยู่เลขที่ของสถานประกอบการ"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  วันที่ออกบัตร <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="issueDate"
                  value={form.issueDate}
                  onChange={handleChange}
                  className={appControlClass}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  บัตรหมดอายุ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleChange}
                  className={appControlClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  ชื่อผู้ลงนามออกบัตร <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="signerName"
                  value={form.signerName}
                  onChange={handleChange}
                  className={appControlClass}
                  placeholder="ระบุชื่อผู้ลงนามเพื่ออนุมัติออกบัตรพนักงาน"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  ตำแหน่งผู้ลงนาม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="signerPosition"
                  value={form.signerPosition}
                  onChange={handleChange}
                  className={appControlClass}
                  placeholder="ระบุตำแหน่งผู้ลงนาม (เช่น นายจ้าง, ผู้มีอำนาจกระทำการแทน)"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/employee-cards")}
            className={appBtnSecondaryClass}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={appBtnPrimaryClass}
          >
            {isSubmitting ? "กำลังบันทึก..." : submitLabel}
          </button>
        </div>
      </form>

      {/* Right Column: Interactive Live Card Preview */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8 h-fit">
        <div className={`${appCardClass} bg-zinc-50/50 dark:bg-zinc-800/20`}>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Live Card Preview (ขนาดจริง 7.2 × 10.3 ซม. อัตราส่วน 1.43)
          </h3>

          <div className="flex flex-col items-center gap-6">
            {/* FRONT CARD */}
            <div className="w-68 h-97.25 bg-white border border-zinc-200 shadow-md rounded-xl overflow-hidden flex flex-col relative text-zinc-900 select-none">
              {/* Header Band */}
              <div className="bg-blue-800 text-white text-[13px] font-bold py-2 px-2 text-center min-h-10 flex items-center justify-center leading-tight">
                {form.cardHeader || "พนักงานขายของหน้าร้าน (คนต่างด้าว)"}
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col p-3 gap-2">
                {/* Photo Frame (Centered) */}
                <div className="flex justify-center my-1 shrink-0">
                  <div className="w-33 h-41.5 border border-zinc-300 rounded flex flex-col items-center justify-center bg-zinc-50 overflow-hidden">
                    {form.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getDisplayPhotoUrl(form.photoUrl)} alt="Employee" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-400 gap-1 text-[11px]">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>ไม่มีรูปถ่าย</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col text-[13px] gap-2 mt-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-blue-900 text-[10.5px] uppercase">ชื่อ-นามสกุล</span>
                    <span className="border-b border-zinc-300 pb-0.5 min-h-4 truncate font-medium">
                      {form.name || "ชื่อ-นามสกุล"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-blue-900 text-[10.5px] uppercase">สัญชาติ</span>
                    <span className="border-b border-zinc-300 pb-0.5 min-h-4 truncate">
                      {form.nationality || "ระบุสัญชาติ"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-blue-900 text-[10.5px] uppercase">เลขที่ใบอนุญาตทำงาน</span>
                    <span className="border-b border-zinc-300 pb-0.5 min-h-4 truncate">
                      {form.workPermitNo || "ระบุเลข 13 หลัก"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Tag */}
              <div className="absolute right-2 bottom-1 text-[9px] text-zinc-400">ด้านหน้า</div>
            </div>

            {/* BACK CARD */}
            <div className="w-68 h-97.25 bg-white border border-zinc-200 shadow-md rounded-xl overflow-hidden flex flex-col p-3.5 relative text-zinc-900 select-none justify-between">
              {/* Instructions Header */}
              <div className="text-center font-bold text-blue-950 text-[13px] leading-tight">
                คำแนะนำ
              </div>

              {/* Instructions text */}
              <div className="text-[10px] text-zinc-600 leading-normal px-1 whitespace-pre-line mt-1">
                {form.instructions || DEFAULT_INSTRUCTIONS}
              </div>

              {/* Fields */}
              <div className="flex flex-col text-[10.5px] gap-2 mt-2 border-t pt-2 border-zinc-100">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-blue-900">ชื่อนายจ้างสถานประกอบการ:</span>
                  <span className="border-b border-zinc-300 truncate font-medium min-h-4">
                    {form.employerName || "บริษัท โบบิล จำกัด"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-blue-900">ตั้งอยู่เลขที่:</span>
                  <span className="border-b border-zinc-300 min-h-8 text-[9px] leading-tight block wrap-break-word line-clamp-2">
                    {form.address || "123/45 ตำบล รอบเวียง อำเภอเมืองเชียงราย จังหวัดเชียงราย 57000"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-blue-900 whitespace-nowrap">วันที่ออกบัตร:</span>
                    <span className="border-b border-zinc-300 flex-1 text-center min-h-3.5">
                      {formatThaiPreviewDate(form.issueDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-blue-900 whitespace-nowrap">บัตรหมดอายุ:</span>
                    <span className="border-b border-zinc-300 flex-1 text-center min-h-3.5">
                      {formatThaiPreviewDate(form.expiryDate)}
                    </span>
                  </div>
                </div>

                {/* Sign block */}
                <div className="flex justify-between items-end mt-2">
                  <div className="flex items-center gap-1 w-[55%]">
                    <span className="font-bold text-blue-900 whitespace-nowrap">โทรศัพท์:</span>
                    <span className="border-b border-zinc-300 flex-1 min-h-3.5">
                      {form.telephone || "080-000-0000"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center w-[40%] text-center leading-none gap-0.5">
                    <span className="text-[9px] text-zinc-400">ลงชื่อ ..........................................</span>
                    <span className="text-[10px] truncate max-w-35 font-medium">
                      ({form.signerName || "ชื่อ สกุล"})
                    </span>
                    <div className="flex items-center justify-center gap-1 text-[9px]">
                      <span className="font-bold text-blue-900">ตำแหน่ง:</span>
                      <span className="border-b border-zinc-300 min-w-10 inline-block">{form.signerPosition || "นายจ้าง"}</span>
                    </div>
                    <span className="text-[8.5px] text-zinc-400 mt-1 font-bold">นายจ้างผู้ออกบัตร</span>
                  </div>
                </div>
              </div>

              {/* Card Tag */}
              <div className="absolute right-2 top-1.5 text-[9px] text-zinc-400">ด้านหลัง</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
