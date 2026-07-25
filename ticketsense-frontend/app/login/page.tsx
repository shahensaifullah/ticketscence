import type { Metadata } from "next";
import Link from "next/link";
import { GoogleIcon, TicketMark } from "../components/icons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your TicketSense workspace.",
};

export default function LoginPage() {
  return (
    <main className="fixed inset-0 grid overflow-y-auto bg-[var(--surface)] px-4 py-10 text-[var(--on-surface)] sm:place-items-center">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-28 size-96 rounded-full bg-[var(--primary-container)]/10 blur-3xl" />
        <div className="absolute -bottom-36 -right-20 size-[28rem] rounded-full bg-[var(--tertiary)]/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 size-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--outline-variant)]/30" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <Link className="mb-6 inline-flex items-center gap-3" href="/">
            <span className="grid size-11 place-items-center rounded-xl bg-[var(--primary-container)] text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)]">
              <TicketMark className="size-7" />
            </span>
            <span className="text-2xl font-bold tracking-[-0.02em]">TicketSense</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-[-0.01em]">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
            Sign in to continue to your AI-powered workspace.
          </p>
        </div>

        <section className="rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 shadow-[0_24px_64px_var(--shadow-color)] sm:p-8">
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--primary-container)]/30 bg-[var(--primary-container)]/10 px-4 py-3">
            <span className="text-[var(--primary)]">✦</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--primary)]">
              AI-Powered Operations
            </span>
          </div>

          <LoginForm />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--outline-variant)]" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--outline)]">or continue with</span>
            <span className="h-px flex-1 bg-[var(--outline-variant)]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container)] px-4 py-3 text-sm font-semibold hover:bg-[var(--surface-container-high)]" type="button">
              <GoogleIcon className="size-4" /> Google
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container)] px-4 py-3 text-sm font-semibold hover:bg-[var(--surface-container-high)]" type="button">
              <span className="grid size-4 place-items-center rounded-full bg-[var(--on-surface)] text-[8px] font-bold text-[var(--surface)]">GH</span>
              GitHub
            </button>
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-[var(--on-surface-variant)]">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-[var(--primary)] hover:underline" href="/register">
            Create an account
          </Link>
        </p>
        <a
          aria-label="Contact support"
          className="fixed bottom-6 right-6 grid size-11 place-items-center rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container)] text-[var(--primary)] shadow-lg hover:bg-[var(--surface-container-high)]"
          href="mailto:support@ticketsense.com"
        >
          ?
        </a>
      </div>
    </main>
  );
}
