"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import AuthShell, {
  AuthAlertError,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
  authSecondaryLinkClass,
} from "@/components/auth/auth-shell";

type LoginForm = {
  username: string;
  password: string;
};

const initialForm: LoginForm = {
  username: "",
  password: "",
};

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<LoginForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return form.username.trim().length >= 3 && form.password.length >= 8;
  }, [form]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!canSubmit) {
      setErrorMessage("กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ถูกต้อง");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      }

      const nextPath = searchParams.get("next");
      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="เข้าสู่ระบบ"
      description="ใช้บัญชีของคุณเพื่อออกใบเสร็จ จัดการรายการ และเข้าถึงแดชบอร์ด"
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
            placeholder="กรอกชื่อผู้ใช้"
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
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className={authInputClass}
            placeholder="กรอกรหัสผ่าน"
            required
          />
        </div>

        {errorMessage ? <AuthAlertError message={errorMessage} /> : null}

        <div className="space-y-4 pt-1">
          <button type="submit" disabled={isSubmitting || !canSubmit} className={authPrimaryButtonClass}>
            {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            ยังไม่มีบัญชี?{" "}
            <Link className={authSecondaryLinkClass} href="/signup">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="เข้าสู่ระบบ" description="กำลังโหลด…">
          <div className="h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </AuthShell>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
