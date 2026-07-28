"use client";

import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useWorkspaces } from "@/app/components/workspace-provider";
import {
  Avatar,
  EmptyState,
  MetricCard,
  PageHeader,
  Panel,
  PriorityBadge,
  StatusBadge,
} from "@/app/components/ui/product-ui";
import {
  getAssignedTickets,
  type AssignedTicketPage,
} from "@/lib/api";

function displayLabel(value: string) {
  return value
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not tracked yet";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MyWorkView() {
  const { selectedWorkspace, isLoading: workspaceLoading } =
    useWorkspaces();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AssignedTicketPage>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setPage(1);
    setData(undefined);
  }, [selectedWorkspace?.slug]);

  useEffect(() => {
    if (!selectedWorkspace) {
      setIsLoading(workspaceLoading);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(undefined);

    getAssignedTickets(selectedWorkspace.slug, page)
      .then((response) => {
        if (active) {
          setData(response);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to load your assigned Tickets.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [page, reloadKey, selectedWorkspace, workspaceLoading]);

  const metrics = data?.metrics ?? {
    assigned_count: 0,
    due_next_seven_days_count: 0,
    completed_count: 0,
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <PageHeader
          description="Tickets assigned to you, ordered by the most recent work timer."
          eyebrow={selectedWorkspace?.name ?? "Personal workspace"}
          title="My Work"
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            change="Current workspace"
            icon={Clock3}
            label="Assigned Tickets"
            value={String(metrics.assigned_count)}
          />
          <MetricCard
            change="Next 7 days"
            icon={CalendarClock}
            label="Due soon"
            tone="warning"
            value={String(metrics.due_next_seven_days_count)}
          />
          <MetricCard
            change="All assigned work"
            icon={CheckCircle2}
            label="Completed or closed"
            tone="success"
            value={String(metrics.completed_count)}
          />
        </section>

        <Panel
          title="Assigned to me"
          description="Most recently timed Tickets appear first · 10 per page"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-[var(--outline)]">
              <Loader2 className="animate-spin" size={18} />
              Loading assigned Tickets…
            </div>
          ) : error ? (
            <div className="grid place-items-center px-6 py-14 text-center">
              <p className="text-sm font-semibold">{error}</p>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--outline-variant)] px-3 py-2 text-xs font-semibold text-[var(--primary)]"
                onClick={() => setReloadKey((current) => current + 1)}
                type="button"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          ) : !data?.results.length ? (
            <EmptyState
              description="Tickets assigned to you in this Workspace will appear here."
              title="No assigned Tickets"
            />
          ) : (
            <>
              <div className="divide-y divide-[var(--outline-variant)]">
                {data.results.map((ticket) => (
                  <Link
                    className="grid gap-3 px-5 py-4 transition hover:bg-[var(--surface-container-high)] md:grid-cols-[90px_minmax(0,1fr)_120px_90px_150px_140px] md:items-center"
                    href={`/tickets/${encodeURIComponent(ticket.reference)}`}
                    key={ticket.uid}
                  >
                    <span className="font-mono text-[10px] font-semibold text-[var(--primary)]">
                      {ticket.reference}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm">
                        {ticket.title}
                      </strong>
                      <span className="mt-1 block truncate text-[10px] text-[var(--outline)]">
                        {ticket.project_name}
                      </span>
                    </span>
                    <StatusBadge status={displayLabel(ticket.status)} />
                    {ticket.priority ? (
                      <PriorityBadge
                        priority={displayLabel(ticket.priority)}
                      />
                    ) : (
                      <span className="text-xs text-[var(--outline)]">
                        No priority
                      </span>
                    )}
                    <span className="text-xs text-[var(--on-surface-variant)]">
                      <span className="block text-[10px] text-[var(--outline)]">
                        Last timer
                      </span>
                      {formatDateTime(ticket.latest_timer_at)}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-[var(--on-surface-variant)]">
                      <Avatar
                        initials={initials(ticket.assignee_name)}
                        name={ticket.assignee_name ?? "Assigned user"}
                        size="sm"
                      />
                      {formatDate(ticket.due_date)}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--outline-variant)] px-5 py-4 text-xs text-[var(--outline)] sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Page {data.page} of {data.total_pages} · {data.count}{" "}
                  assigned {data.count === 1 ? "Ticket" : "Tickets"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--outline-variant)] px-3 py-2 font-semibold text-[var(--on-surface)] disabled:opacity-40"
                    disabled={!data.previous}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    type="button"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--outline-variant)] px-3 py-2 font-semibold text-[var(--on-surface)] disabled:opacity-40"
                    disabled={!data.next}
                    onClick={() => setPage((current) => current + 1)}
                    type="button"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
