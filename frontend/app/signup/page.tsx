"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import AuthShell, {
  AuthAlertError,
  AuthAlertSuccess,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
  authSecondaryLinkClass,
} from "@/components/auth/auth-shell";

type SignupForm = {
  username: string;
  password: string;
  confirmPassword: string;
};

const initialForm: SignupForm = {
  username: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {
  const [form, setForm] = useState<SignupForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      form.username.trim().length >= 3 &&
      form.password.length >= 8 &&
      form.password === form.confirmPassword
    );
  }, [form]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!canSubmit) {
      setErrorMessage("กรุณากรอกข้อมูลให้ครบและถูกต้อง");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          roles: ["USER"],
        }),
      });

      const payload = (await response.json()) as { message?: string; username?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "ลงทะเบียนไม่สำเร็จ");
      }

      setSuccessMessage(`สร้างบัญชี "${payload.username ?? form.username}" เรียบร้อยแล้ว`);
      setForm(initialForm);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="สร้างบัญชีผู้ใช้"
      description="สร้างบัญชีผู้ใช้ใหม่เพื่อเข้าถึงระบบ"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={authLabelClass} htmlFor="username">
            ชื่อผู้ใช้
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            className={authInputClass}
            placeholder="อย่างน้อย 6 ตัวอักษร เป็นภาษาอังกฤษ"
            required
          />
        </div>

        <div>
          <label className={authLabelClass} htmlFor="password">
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className={authInputClass}
            placeholder="อย่างน้อย 8 ตัวอักษร ภาษาอังกฤษ หรือตัวเลข"
            pattern="^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$"
            title="รหัสผ่านต้องมีอย่างน้อย 8 ตัว ภาษาอังกฤษ หรือตัวเลข"
            required
          />
        </div>

        <div>
          <label className={authLabelClass} htmlFor="confirmPassword">
            ยืนยันรหัสผ่าน
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            className={authInputClass}
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            required
          />
        </div>

        {form.confirmPassword.length > 0 && form.password !== form.confirmPassword ? (
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">รหัสผ่านไม่ตรงกัน</p>
        ) : null}

        {errorMessage ? <AuthAlertError message={errorMessage} /> : null}
        {successMessage ? <AuthAlertSuccess message={successMessage} /> : null}

        <div className="space-y-4 pt-1">
          <button type="submit" disabled={isSubmitting || !canSubmit} className={authPrimaryButtonClass}>
            {isSubmitting ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
          </button>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            มีบัญชีแล้ว?{" "}
            <Link className={authSecondaryLinkClass} href="/login">
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
