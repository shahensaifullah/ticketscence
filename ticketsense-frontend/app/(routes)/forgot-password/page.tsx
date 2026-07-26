import type { Metadata } from "next";
import { AuthActionPage } from "@/app/components/auth-action-page";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthActionPage description="Enter your work email and we’ll send a secure password-reset link." title="Reset your password">
      <form className="mt-6 space-y-4 text-left">
        <label className="block text-xs font-medium">Work email<input className="mt-2 h-11 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-sm outline-none focus:border-[var(--primary)]" placeholder="you@example.com" required type="email" /></label>
        <button className="h-11 w-full rounded-lg bg-[var(--primary-container)] text-sm font-semibold text-[var(--on-primary-container)]" type="submit">Send reset link</button>
      </form>
    </AuthActionPage>
  );
}
