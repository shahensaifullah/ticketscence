import type { Metadata } from "next";
import { AuthActionPage } from "../components/auth-action-page";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <AuthActionPage description="Choose a strong password with at least eight characters." title="Create a new password">
      <form className="mt-6 space-y-4 text-left">
        <label className="block text-xs font-medium">New password<input className="mt-2 h-11 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-sm outline-none focus:border-[var(--primary)]" minLength={8} required type="password" /></label>
        <label className="block text-xs font-medium">Confirm password<input className="mt-2 h-11 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-sm outline-none focus:border-[var(--primary)]" minLength={8} required type="password" /></label>
        <button className="h-11 w-full rounded-lg bg-[var(--primary-container)] text-sm font-semibold text-[var(--on-primary-container)]" type="submit">Update password</button>
      </form>
    </AuthActionPage>
  );
}
