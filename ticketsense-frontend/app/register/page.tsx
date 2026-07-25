import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../components/auth-shell";
import { SsoButtons } from "../components/sso-buttons";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your TicketSense workspace.",
};

export default function RegisterPage() {
  return (
    <AuthShell mode="register">
      <p className="auth-eyebrow">Get started</p>
      <h1>Create your workspace</h1>
      <p className="auth-subtitle">
        Start organizing support signals in a few minutes.
      </p>

      <RegisterForm />

      <SsoButtons />

      <p className="auth-switch">
        Already have an account?
        <Link className="text-link" href="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
