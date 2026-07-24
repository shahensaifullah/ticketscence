import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="fixed inset-0 grid place-items-center bg-[var(--surface)] p-6 text-center">
      <div>
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-xl bg-[var(--surface-container-high)] text-[var(--primary)]"><SearchX size={22} /></span>
        <p className="font-mono text-[10px] text-[var(--outline)]">404 · NOT FOUND</p>
        <h1 className="mt-2 text-2xl font-semibold">This page does not exist</h1>
        <p className="mt-2 text-sm text-[var(--on-surface-variant)]">The link may be outdated or the resource may have moved.</p>
        <Link className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-3 text-sm font-semibold text-[var(--on-primary-container)]" href="/dashboard"><ArrowLeft size={15} /> Return to dashboard</Link>
      </div>
    </main>
  );
}
