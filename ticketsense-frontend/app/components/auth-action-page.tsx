import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ShieldAlert } from "lucide-react";
import { TicketMark } from "./icons";

export function AuthActionPage({
  children,
  description,
  icon = "mail",
  title,
}: {
  children?: React.ReactNode;
  description: string;
  icon?: "mail" | "success" | "warning";
  title: string;
}) {
  const Icon = icon === "success" ? CheckCircle2 : icon === "warning" ? ShieldAlert : Mail;
  return (
    <main className="fixed inset-0 grid place-items-center overflow-y-auto bg-[var(--surface)] p-4">
      <div className="w-full max-w-md">
        <Link className="mb-7 flex items-center justify-center gap-3" href="/login">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--primary-container)] text-[var(--on-primary-container)]"><TicketMark className="size-6" /></span>
          <strong className="text-xl">TicketSense</strong>
        </Link>
        <section className="rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 text-center shadow-[0_24px_64px_var(--shadow-color)] sm:p-8">
          <span className="mx-auto mb-5 grid size-12 place-items-center rounded-xl bg-[var(--secondary-container)] text-[var(--on-secondary-container)]"><Icon size={20} /></span>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--on-surface-variant)]">{description}</p>
          {children}
          <Link className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)]" href="/login"><ArrowLeft size={14} /> Back to sign in</Link>
        </section>
      </div>
    </main>
  );
}
