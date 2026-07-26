"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Search,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/app/components/ui/product-ui";
import { useWorkspaces } from "@/app/components/workspace-provider";
import {
  getBoardTickets,
  getWorkspaceDashboard,
  updateBoardTicket,
  type BoardTicket,
  type WorkspaceMember,
} from "@/lib/api";

const columns: Array<{
  status: BoardTicket["status"];
  label: string;
}> = [
  { status: "backlog", label: "Backlog" },
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In progress" },
  { status: "in_review", label: "In review" },
  { status: "completed", label: "Completed" },
  { status: "closed", label: "Closed" },
];

const priorityStyles = {
  critical: "text-[var(--error)]",
  high: "text-[var(--warning)]",
  medium: "text-[var(--primary)]",
  low: "text-[var(--outline)]",
} as const;

export function BoardView() {
  const { selectedWorkspace } = useWorkspaces();
  const [tickets, setTickets] = useState<BoardTicket[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [query, setQuery] = useState("");
  const [savingReference, setSavingReference] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!selectedWorkspace) return;
    let active = true;
    Promise.all([
      getBoardTickets(selectedWorkspace.slug),
      getWorkspaceDashboard(selectedWorkspace.slug),
    ])
      .then(([ticketData, dashboard]) => {
        if (!active) return;
        setTickets(ticketData);
        setMembers(
          dashboard.members.filter((member) => member.role !== "guest"),
        );
      })
      .catch(() => {
        if (active) setError("Unable to load the Board.");
      });
    return () => {
      active = false;
    };
  }, [selectedWorkspace]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tickets;
    return tickets.filter((ticket) =>
      `${ticket.reference} ${ticket.title} ${ticket.project_name ?? ""} ${ticket.assignee_name ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, tickets]);

  async function updateCard(
    ticket: BoardTicket,
    payload: {
      status?: BoardTicket["status"];
      assignee_uid?: string | null;
    },
  ) {
    if (!selectedWorkspace) return;
    setSavingReference(ticket.reference);
    setError(undefined);
    try {
      const updated = await updateBoardTicket(
        selectedWorkspace.slug,
        ticket.reference,
        payload,
      );
      setTickets((current) =>
        current.map((item) =>
          item.uid === updated.uid ? updated : item,
        ),
      );
    } catch {
      setError(`Unable to update ${ticket.reference}.`);
    } finally {
      setSavingReference(undefined);
    }
  }

  function moveCard(ticket: BoardTicket, direction: -1 | 1) {
    const index = columns.findIndex(
      (column) => column.status === ticket.status,
    );
    const next = columns[index + direction];
    if (next) void updateCard(ticket, { status: next.status });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="mb-5">
        <PageHeader
          actions={
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-3 py-2 text-xs font-semibold text-[var(--on-primary-container)]"
              href="/topics"
            >
              <MessageSquareText size={14} /> New Topic
            </Link>
          }
          description="Every card is a Ticket. Move work through the flow and assign a teammate directly on the card."
          eyebrow={selectedWorkspace?.name ?? "Workspace"}
          title="Board"
        />
      </div>

      {error ? (
        <p
          className="mb-4 rounded-lg border border-[var(--error)]/35 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <label className="relative mb-4 block max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--outline)]"
          size={16}
        />
        <span className="sr-only">Search Board</span>
        <input
          className="h-10 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search cards…"
          value={query}
        />
      </label>

      <div className="min-h-0 flex-1 overflow-x-auto pb-3">
        <div className="grid h-full min-w-[1740px] grid-cols-6 gap-3">
          {columns.map((column, columnIndex) => {
            const cards = filtered.filter(
              (ticket) => ticket.status === column.status,
            );
            return (
              <section
                className="flex min-h-0 flex-col rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container)]"
                key={column.status}
              >
                <header className="flex items-center justify-between border-b border-[var(--outline-variant)] px-4 py-3">
                  <h2 className="text-xs font-semibold">{column.label}</h2>
                  <span className="grid min-w-5 place-items-center rounded-full bg-[var(--surface-container-high)] px-1.5 py-0.5 font-mono text-[9px]">
                    {cards.length}
                  </span>
                </header>
                <div className="space-y-3 overflow-y-auto p-3">
                  {cards.map((ticket) => {
                    const saving = savingReference === ticket.reference;
                    return (
                      <article
                        className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 shadow-sm"
                        key={ticket.uid}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <Link
                            className="font-mono text-[10px] font-semibold text-[var(--primary)]"
                            href={`/tickets/${ticket.reference}`}
                          >
                            {ticket.reference}
                          </Link>
                          {ticket.priority ? (
                            <span
                              className={`text-[9px] font-semibold uppercase ${priorityStyles[ticket.priority]}`}
                            >
                              {ticket.priority}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-xs font-semibold leading-5">
                          {ticket.title}
                        </h3>
                        {ticket.project_name ? (
                          <p className="mt-2 text-[10px] text-[var(--outline)]">
                            {ticket.project_name}
                          </p>
                        ) : null}

                        <label className="mt-4 block">
                          <span className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-[var(--outline)]">
                            <UserRound size={11} /> Assignee
                          </span>
                          <select
                            className="h-8 w-full rounded border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-2 text-[11px] outline-none focus:border-[var(--primary)]"
                            disabled={saving}
                            onChange={(event) =>
                              void updateCard(ticket, {
                                assignee_uid: event.target.value || null,
                              })
                            }
                            value={ticket.assignee_uid ?? ""}
                          >
                            <option value="">Unassigned</option>
                            {members.map((member) => (
                              <option key={member.user_uid} value={member.user_uid}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="mt-3 flex justify-end gap-1">
                          <button
                            aria-label={`Move ${ticket.reference} backward`}
                            className="grid size-7 place-items-center rounded border border-[var(--outline-variant)] hover:bg-[var(--surface-container-high)] disabled:opacity-30"
                            disabled={saving || columnIndex === 0}
                            onClick={() => moveCard(ticket, -1)}
                            type="button"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            aria-label={`Move ${ticket.reference} forward`}
                            className="grid size-7 place-items-center rounded border border-[var(--outline-variant)] hover:bg-[var(--surface-container-high)] disabled:opacity-30"
                            disabled={
                              saving || columnIndex === columns.length - 1
                            }
                            onClick={() => moveCard(ticket, 1)}
                            type="button"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
