"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readCustomTickets, seedTickets, type Ticket } from "@/lib/ticket-data";

const priorityStyles: Record<Ticket["priority"], string> = {
  Critical: "border-[var(--error)]/30 bg-[var(--error-container)]/20 text-[var(--error)]",
  High: "border-[var(--primary)]/30 bg-[var(--primary-container)]/20 text-[var(--primary)]",
  Medium: "border-[var(--tertiary)]/30 bg-[var(--tertiary-container)]/20 text-[var(--tertiary)]",
  Low: "border-[var(--outline)]/30 bg-[var(--surface-container-highest)]/30 text-[var(--on-surface-variant)]",
};

const statusStyles: Record<Ticket["status"], string> = {
  Open: "border-[var(--error)]/30 bg-[var(--error-container)]/20 text-[var(--error)]",
  "In Progress": "border-[var(--primary)]/30 bg-[var(--primary-container)]/20 text-[var(--primary)]",
  Review: "border-[var(--tertiary)]/30 bg-[var(--tertiary-container)]/20 text-[var(--tertiary)]",
  Backlog: "border-[var(--outline)]/30 bg-[var(--surface-container-highest)]/30 text-[var(--on-surface-variant)]",
  Resolved: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
  Closed: "border-[var(--outline)]/30 bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]",
};

export function TicketDetail({ id }: { id: string }) {
  const [ticket, setTicket] = useState<Ticket | null | undefined>(() =>
    seedTickets.find((item) => item.id === id),
  );

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setTicket(
        seedTickets.find((item) => item.id === id) ??
          readCustomTickets().find((item) => item.id === id) ??
          null,
      );
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, [id]);

  if (ticket === undefined) {
    return <div className="flex-1 bg-[var(--surface)]" />;
  }

  if (ticket === null) {
    return (
      <div className="grid flex-1 place-items-center p-6">
        <div className="max-w-md text-center">
          <span className="mx-auto mb-5 grid size-14 place-items-center rounded-xl bg-[var(--surface-container-highest)] text-xl text-[var(--primary)]">?</span>
          <h1 className="text-2xl font-semibold">Ticket {id} was not found</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--on-surface-variant)]">
            It may have been removed, or the ticket link may be incorrect.
          </p>
          <Link className="mt-6 inline-block rounded-lg bg-[var(--primary-container)] px-5 py-3 text-sm font-semibold text-white" href="/tickets">
            Return to all tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Link className="font-mono text-xs font-semibold text-[var(--primary)] hover:underline" href="/tickets">
                {ticket.id}
              </Link>
              <span className="text-[var(--outline-variant)]">•</span>
              <span className="font-mono text-[10px] text-[var(--outline)]">Created {ticket.created}</span>
              <span className="text-[var(--outline-variant)]">•</span>
              <span className="font-mono text-[10px] text-[var(--outline)]">{ticket.project}</span>
            </div>
            <h1 className="max-w-3xl text-2xl font-semibold leading-8 tracking-[-0.01em]">{ticket.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className={priorityStyles[ticket.priority]}>{ticket.priority.toUpperCase()}</Badge>
              <Badge className={statusStyles[ticket.status]}>{ticket.status.toUpperCase()}</Badge>
              <Badge className="border-[var(--outline)]/30 bg-[var(--surface-container-highest)]/30 text-[var(--on-surface-variant)]">{ticket.type.toUpperCase()}</Badge>
            </div>
          </div>

          <section className="mb-6 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-lg font-semibold">
                <span className="text-[var(--primary)]">▤</span>
                Description
              </h2>
              <button className="font-mono text-[10px] font-semibold text-[var(--primary)] hover:underline" type="button">EDIT</button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--on-surface-variant)]">{ticket.description}</p>
          </section>

          <section className="mb-6 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5">
            <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold">
              <span className="text-[var(--primary)]">⌕</span>
              Attachments
            </h2>
            <div className="rounded-lg border border-dashed border-[var(--outline-variant)] p-7 text-center">
              <p className="text-sm text-[var(--on-surface-variant)]">No files attached to this issue.</p>
              <label className="mt-3 inline-block cursor-pointer text-xs font-semibold text-[var(--primary)] hover:underline">
                Upload attachment
                <input className="sr-only" multiple type="file" />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold">
              <span className="text-[var(--primary)]">◌</span>
              Activity
            </h2>
            <div className="flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--outline-variant)] bg-[var(--surface)] text-[9px] text-[var(--primary)]">AM</span>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <strong className="text-sm">Alex Morgan</strong>
                  <span className="font-mono text-[10px] text-[var(--outline)]">{ticket.created}</span>
                </div>
                <p className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container)] p-4 text-sm text-[var(--on-surface-variant)]">
                  Created this issue in {ticket.project}.
                </p>
              </div>
            </div>
            <form className="mt-6 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-high)] p-4">
              <label className="sr-only" htmlFor={`comment-${ticket.id}`}>Add a comment</label>
              <textarea
                className="min-h-24 w-full resize-y bg-transparent text-sm text-[var(--on-surface)] outline-none placeholder:text-[var(--outline)]"
                id={`comment-${ticket.id}`}
                placeholder="Write a comment or mention a teammate..."
              />
              <div className="flex justify-end border-t border-[var(--outline-variant)] pt-3">
                <button className="rounded-lg bg-[var(--primary-container)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]" type="submit">Send</button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <aside className="border-t border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 xl:overflow-y-auto xl:border-l xl:border-t-0">
        <article className="ai-panel mb-6 rounded-xl p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-[var(--primary-container)] text-white">✦</span>
            <h2 className="text-xl font-bold">AI triage</h2>
          </div>
          <p className="mb-4 text-sm leading-6 text-[var(--on-surface-variant)]">
            TicketSense classified this as a <strong className="text-[var(--on-surface)]">{ticket.priority.toLowerCase()} priority {ticket.type.toLowerCase()}</strong>.
            Review recent {ticket.project} issues for related incidents before assigning a fix.
          </p>
          <button className="w-full rounded-lg bg-[var(--primary-container)] px-4 py-3 text-sm font-bold text-[var(--on-primary-container)] hover:bg-[var(--primary-hover)]" type="button">
            Find similar issues
          </button>
        </article>

        <SidebarSection title="DETAILS">
          <Detail label="ASSIGNEE">
            <span className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-[var(--primary-container)] text-[9px] text-white">{ticket.initials}</span>
              {ticket.assignee}
            </span>
          </Detail>
          <Detail label="PROJECT">{ticket.project}</Detail>
          <Detail label="DUE DATE"><span className={ticket.priority === "Critical" ? "text-[var(--error)]" : ""}>◷ {ticket.dueDate ?? "Not set"}</span></Detail>
          <Detail label="LABELS">
            <span className="flex flex-wrap gap-2">
              {ticket.labels.length ? (
                ticket.labels.map((label) => (
                  <span className="rounded bg-[var(--surface-container-highest)] px-2 py-1 text-[11px]" key={label}>{label}</span>
                ))
              ) : (
                <span className="text-[var(--outline)]">No labels</span>
              )}
            </span>
          </Detail>
        </SidebarSection>

        <SidebarSection title="WORKFLOW">
          <label className="block text-xs text-[var(--outline)]">
            Status
            <select className="mt-2 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 py-2.5 text-sm text-[var(--on-surface)]" defaultValue={ticket.status}>
              <option>Open</option>
              <option>In Progress</option>
              <option>Review</option>
              <option>Backlog</option>
            </select>
          </label>
        </SidebarSection>
      </aside>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold ${className}`}>{children}</span>;
}

function SidebarSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="mb-6 border-b border-[var(--outline-variant)] pb-6 last:border-0">
      <h3 className="mb-3 font-mono text-[10px] tracking-wider text-[var(--outline)]">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Detail({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-3 py-2 text-sm">
      <span className="font-mono text-[9px] text-[var(--outline)]">{label}</span>
      <span className="text-[var(--on-surface-variant)]">{children}</span>
    </div>
  );
}
