import type { Metadata } from "next";
import { AuthActionPage } from "../components/auth-action-page";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return <AuthActionPage description="We sent a verification link to your work email. Open it to activate your TicketSense workspace." icon="success" title="Check your inbox"><button className="mt-6 h-11 w-full rounded-lg border border-[var(--outline-variant)] text-sm font-semibold hover:bg-[var(--surface-container-high)]" type="button">Resend verification email</button></AuthActionPage>;
}
