"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, PageHeader, PriorityBadge } from "../components/ui/product-ui";
import {
  workspaceTickets,
  type WorkspaceTicket,
  type WorkspaceTicketStatus,
} from "../mocks/product-data";

const columns: WorkspaceTicketStatus[] = [
  "Backlog",
  "Open",
  "In progress",
  "In review",
  "Resolved",
  "Closed",
];

export function BoardView() {
  const [tickets, setTickets] = useState<WorkspaceTicket[]>(workspaceTickets);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      tickets.filter((ticket) =>
        `${ticket.id} ${ticket.title} ${ticket.project}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, tickets],
  );

  function moveTicket(id: string, direction: -1 | 1) {
    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== id) return ticket;
        const currentIndex = columns.indexOf(ticket.status);
        const nextStatus = columns[currentIndex + direction];
        return nextStatus ? { ...ticket, status: nextStatus } : ticket;
      }),
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="mb-5">
        <PageHeader
          actions={
            <>
              <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--outline-variant)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-container-high)]" type="button">
                <Filter size={14} /> Filter
              </button>
              <Link className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-3 py-2 text-xs font-semibold text-[var(--on-primary-container)]" href="/tickets/new">
                <Plus size={14} /> Quick create
              </Link>
            </>
          }
          description="Move tickets through the workflow. Changes are optimistic in this frontend preview."
          eyebrow="Core Platform · Active sprint"
          title="Delivery board"
        />
      </div>
      <label className="relative mb-4 block max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--outline)]" size={16} />
        <span className="sr-only">Search board</span>
        <input className="h-10 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)]" onChange={(event) => setQuery(event.target.value)} placeholder="Search the board…" value={query} />
      </label>
      <div className="min-h-0 flex-1 overflow-x-auto pb-3">
        <div className="grid h-full min-w-[1780px] grid-cols-6 gap-3">
          {columns.map((column) => {
            const columnTickets = filtered.filter((ticket) => ticket.status === column);
            return (
              <section className="flex min-h-0 flex-col rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container)]" key={column}>
                <header className="flex items-center justify-between border-b border-[var(--outline-variant)] px-4 py-3">
                  <h2 className="text-xs font-semibold">{column}</h2>
                  <span className="grid min-w-5 place-items-center rounded-full bg-[var(--surface-container-high)] px-1.5 py-0.5 font-mono text-[9px]">{columnTickets.length}</span>
                </header>
                <div className="space-y-3 overflow-y-auto p-3">
                  {columnTickets.map((ticket) => (
                    <article className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 shadow-sm" key={ticket.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <Link className="font-mono text-[9px] font-semibold text-[var(--primary)]" href={`/tickets/${ticket.id}`}>{ticket.id}</Link>
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                      <Link className="block text-xs font-semibold leading-5 hover:text-[var(--primary)]" href={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {ticket.labels.slice(0, 2).map((label) => <span className="rounded bg-[var(--surface-container-high)] px-1.5 py-0.5 text-[9px] text-[var(--on-surface-variant)]" key={label}>{label}</span>)}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Avatar initials={ticket.assigneeInitials} name={ticket.assignee} size="sm" />
                        <div className="flex gap-1">
                          <button aria-label={`Move ${ticket.id} left`} className="grid size-7 place-items-center rounded border border-[var(--outline-variant)] hover:bg-[var(--surface-container-high)] disabled:opacity-30" disabled={column === "Backlog"} onClick={() => moveTicket(ticket.id, -1)} type="button"><ChevronLeft size={13} /></button>
                          <button aria-label={`Move ${ticket.id} right`} className="grid size-7 place-items-center rounded border border-[var(--outline-variant)] hover:bg-[var(--surface-container-high)] disabled:opacity-30" disabled={column === "Closed"} onClick={() => moveTicket(ticket.id, 1)} type="button"><ChevronRight size={13} /></button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
