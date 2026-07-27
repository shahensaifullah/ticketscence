"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Play,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaces } from "@/app/components/workspace-provider";
import { timerChangedEvent } from "@/app/components/tickets/global-timer-widget";
import {
  deleteTicket,
  getTicket,
  getWorkspaceDashboard,
  startTicketTimer,
  stopTicketTimer,
  updateBoardTicket,
  type TicketDetailResponse,
  type TopicTicket,
} from "@/lib/api";

const statusLabels: Record<TopicTicket["status"], string> = {
  backlog: "Backlog",
  open: "Open",
  in_progress: "In progress",
  in_review: "In review",
  completed: "Completed",
  closed: "Closed",
};

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Running";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TicketDetail({ id }: { id: string }) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaces();
  const [ticket, setTicket] = useState<
    TicketDetailResponse | null | undefined
  >();
  const [currentUserUid, setCurrentUserUid] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimateMinutes, setEstimateMinutes] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const loadTicket = useCallback(async () => {
    if (!selectedWorkspace) return;
    const data = await getTicket(selectedWorkspace.slug, id);
    setTicket(data);
    setDueDate(data.due_date ?? "");
    setEstimateMinutes(data.estimated_minutes.toString());
  }, [id, selectedWorkspace]);

  useEffect(() => {
    if (!selectedWorkspace) return;
    let active = true;
    Promise.all([
      getTicket(selectedWorkspace.slug, id),
      getWorkspaceDashboard(selectedWorkspace.slug),
    ])
      .then(([ticketData, dashboard]) => {
        if (!active) return;
        setTicket(ticketData);
        setDueDate(ticketData.due_date ?? "");
        setEstimateMinutes(ticketData.estimated_minutes.toString());
        setCurrentUserUid(dashboard.user.uid);
      })
      .catch(() => {
        if (active) setTicket(null);
      });
    return () => {
      active = false;
    };
  }, [id, selectedWorkspace]);

  const activeTimer = ticket?.active_timer;
  const timerOwner =
    Boolean(activeTimer) && activeTimer?.user_uid === currentUserUid;
  const canManageAnyTimer =
    selectedWorkspace?.role === "owner" ||
    selectedWorkspace?.role === "admin";
  const canTrack = selectedWorkspace?.role !== "guest";

  useEffect(() => {
    if (!activeTimer) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  useEffect(() => {
    const handleTimerChange = () => void loadTicket();
    window.addEventListener(timerChangedEvent, handleTimerChange);
    return () =>
      window.removeEventListener(timerChangedEvent, handleTimerChange);
  }, [loadTicket]);

  const liveTimerSeconds = useMemo(() => {
    if (!activeTimer) return 0;
    return Math.max(
      activeTimer.progress_seconds,
      Math.floor(
        (now - new Date(activeTimer.started_at).getTime()) / 1000,
      ),
    );
  }, [activeTimer, now]);

  const totalTrackedSeconds = ticket
    ? ticket.total_tracked_seconds -
      (activeTimer?.elapsed_seconds ?? 0) +
      liveTimerSeconds
    : 0;

  async function toggleTimer() {
    if (!selectedWorkspace || !ticket) return;
    setIsSaving(true);
    setError(undefined);
    try {
      if (activeTimer) {
        await stopTicketTimer(selectedWorkspace.slug, ticket.reference);
      } else {
        await startTicketTimer(selectedWorkspace.slug, ticket.reference);
      }
      await loadTicket();
      setNow(Date.now());
      window.dispatchEvent(new Event(timerChangedEvent));
    } catch {
      setError(
        activeTimer
          ? "Unable to stop this timer."
          : "Unable to start the timer. Stop your other running timer first.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveDueDate() {
    if (!selectedWorkspace || !ticket) return;
    setIsSaving(true);
    setError(undefined);
    try {
      const updated = await updateBoardTicket(
        selectedWorkspace.slug,
        ticket.reference,
        { due_date: dueDate || null },
      );
      setTicket((current) =>
        current ? { ...current, ...updated } : current,
      );
    } catch {
      setError("Unable to update the due date.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveEstimate() {
    if (!selectedWorkspace || !ticket) return;
    setIsSaving(true);
    setError(undefined);
    try {
      const updated = await updateBoardTicket(
        selectedWorkspace.slug,
        ticket.reference,
        {
          estimated_minutes: Math.max(
            0,
            Number(estimateMinutes) || 0,
          ),
        },
      );
      setTicket((current) =>
        current ? { ...current, ...updated } : current,
      );
      setEstimateMinutes(updated.estimated_minutes.toString());
    } catch {
      setError("Unable to update the estimated time.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(status: TopicTicket["status"]) {
    if (!selectedWorkspace || !ticket) return;
    setIsSaving(true);
    setError(undefined);
    try {
      await updateBoardTicket(selectedWorkspace.slug, ticket.reference, {
        status,
      });
      await loadTicket();
      window.dispatchEvent(new Event(timerChangedEvent));
    } catch {
      setError("Unable to update the Ticket status.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !selectedWorkspace ||
      !ticket ||
      deleteConfirmation !==
        (ticket.origin_topic?.title ?? ticket.reference)
    ) {
      return;
    }
    setIsSaving(true);
    try {
      await deleteTicket(
        selectedWorkspace.slug,
        ticket.reference,
        deleteConfirmation,
      );
      router.replace("/board");
      router.refresh();
    } catch {
      setError("Unable to delete the Ticket.");
      setIsSaving(false);
    }
  }

  if (ticket === undefined) {
    return (
      <div className="grid flex-1 place-items-center text-sm text-[var(--outline)]">
        Loading Ticket…
      </div>
    );
  }

  if (ticket === null) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Ticket {id} was not found</h1>
          <Link
            className="mt-5 inline-block text-sm font-semibold text-[var(--primary)]"
            href="/board"
          >
            Return to Tickets
          </Link>
        </div>
      </div>
    );
  }

  const timerDisabled =
    isSaving ||
    !canTrack ||
    ticket.status === "completed" ||
    ticket.status === "closed" ||
    Boolean(activeTimer && !timerOwner && !canManageAnyTimer);
  const confirmationTarget =
    ticket.origin_topic?.title ?? ticket.reference;
  const canDelete =
    selectedWorkspace?.role === "owner" ||
    selectedWorkspace?.role === "admin";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <main className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-[var(--outline)]">
          <Link className="text-[var(--primary)] hover:underline" href="/board">
            Tickets
          </Link>
          <span>/</span>
          <span>{ticket.reference}</span>
          <span>·</span>
          <span>{ticket.project_name}</span>
        </div>

        <header className="mb-6">
          <h1 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-3xl">
            {ticket.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase">
            <span className="rounded-full bg-[var(--surface-container-high)] px-3 py-1">
              {statusLabels[ticket.status]}
            </span>
            {ticket.priority ? (
              <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[var(--primary)]">
                {ticket.priority}
              </span>
            ) : null}
          </div>
        </header>

        <section className="mb-6 rounded-xl border border-[var(--primary)]/35 bg-[var(--primary)]/5 p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                <Clock3 size={15} /> Work timer
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold">
                {activeTimer
                  ? formatDuration(liveTimerSeconds)
                  : formatDuration(totalTrackedSeconds)}
              </p>
              <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                {activeTimer
                  ? `Running for ${activeTimer.user_name} · syncing every 15 seconds`
                  : `Total tracked · ${ticket.time_entries.length} session${ticket.time_entries.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <button
              className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${
                activeTimer
                  ? "bg-[var(--error)]"
                  : "bg-[var(--primary-container)]"
              }`}
              disabled={timerDisabled}
              onClick={() => void toggleTimer()}
              type="button"
            >
              {activeTimer ? <Square size={15} /> : <Play size={15} />}
              {activeTimer ? "Stop timer" : "Start timer"}
            </button>
          </div>
        </section>

        {error ? (
          <p
            className="mb-5 rounded-lg border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-6">
            <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold">Description</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--on-surface-variant)]">
                {ticket.description}
              </p>
            </section>

            {ticket.origin_topic ? (
              <Link
                className="block rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-5 transition hover:bg-[var(--primary)]/10"
                href={`/topics/${ticket.origin_topic.uid}`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">
                  Origin Topic
                </span>
                <strong className="mt-2 block text-sm">
                  {ticket.origin_topic.title}
                </strong>
                <span className="mt-1 block text-xs capitalize text-[var(--on-surface-variant)]">
                  {ticket.origin_topic.topic_type.replaceAll("_", " ")} ·{" "}
                  {ticket.origin_topic.status.replaceAll("_", " ")}
                </span>
              </Link>
            ) : null}

            <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Time history</h2>
                  <p className="mt-1 text-xs text-[var(--outline)]">
                    Every start and stop is retained as a separate session.
                  </p>
                </div>
                <span className="font-mono text-sm">
                  {formatDuration(totalTrackedSeconds)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="border-b border-[var(--outline-variant)] text-[10px] uppercase text-[var(--outline)]">
                    <tr>
                      <th className="px-2 py-3">Member</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3">Started</th>
                      <th className="px-2 py-3">Ended</th>
                      <th className="px-2 py-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticket.time_entries.map((entry) => (
                      <tr
                        className="border-b border-[var(--outline-variant)]/60 last:border-0"
                        key={entry.uid}
                      >
                        <td className="px-2 py-3 font-medium">
                          {entry.user_name}
                        </td>
                        <td className="px-2 py-3 capitalize">
                          <span
                            className={`rounded-full px-2 py-1 ${
                              entry.status === "progressing"
                                ? "bg-[var(--success)]/10 text-[var(--success)]"
                                : "bg-[var(--surface-container-high)]"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          {formatDateTime(entry.started_at)}
                        </td>
                        <td className="px-2 py-3">
                          {formatDateTime(entry.stopped_at)}
                        </td>
                        <td className="px-2 py-3 text-right font-mono">
                          {formatDuration(
                            entry.status === "progressing"
                              ? liveTimerSeconds
                              : entry.duration_seconds,
                          )}
                        </td>
                      </tr>
                    ))}
                    {!ticket.time_entries.length ? (
                      <tr>
                        <td
                          className="px-2 py-8 text-center text-[var(--outline)]"
                          colSpan={5}
                        >
                          No time sessions yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide">
                Details
              </h2>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-[10px] uppercase text-[var(--outline)]">
                    Project
                  </dt>
                  <dd className="mt-1 font-medium">{ticket.project_name}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-[var(--outline)]">
                    Assignee
                  </dt>
                  <dd className="mt-1">
                    {ticket.assignee_name ?? "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-[var(--outline)]">
                    Estimated time
                  </dt>
                  <dd className="mt-2">
                    <div className="flex gap-2">
                      <input
                        aria-label="Estimated minutes"
                        className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm"
                        disabled={selectedWorkspace?.role === "guest"}
                        min="0"
                        onChange={(event) =>
                          setEstimateMinutes(event.target.value)
                        }
                        type="number"
                        value={estimateMinutes}
                      />
                      <button
                        className="rounded-lg bg-[var(--primary-container)] px-3 text-xs font-semibold text-white disabled:opacity-40"
                        disabled={
                          isSaving ||
                          selectedWorkspace?.role === "guest" ||
                          estimateMinutes ===
                            ticket.estimated_minutes.toString()
                        }
                        onClick={() => void saveEstimate()}
                        type="button"
                      >
                        Save
                      </button>
                    </div>
                    <span className="mt-1 block text-[10px] text-[var(--outline)]">
                      Minutes ·{" "}
                      {ticket.estimated_minutes
                        ? formatDuration(ticket.estimated_minutes * 60)
                        : "No estimate"}
                    </span>
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5">
              <label className="text-xs font-semibold" htmlFor="ticket-status">
                Status
              </label>
              <select
                className="mt-2 h-10 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm"
                disabled={isSaving || selectedWorkspace?.role === "guest"}
                id="ticket-status"
                onChange={(event) =>
                  void updateStatus(
                    event.target.value as TopicTicket["status"],
                  )
                }
                value={ticket.status}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </section>

            <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5">
              <label
                className="flex items-center gap-2 text-xs font-semibold"
                htmlFor="ticket-due-date"
              >
                <CalendarDays size={14} /> Due date
              </label>
              <input
                className="mt-2 h-10 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm"
                disabled={selectedWorkspace?.role === "guest"}
                id="ticket-due-date"
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
              <button
                className="mt-3 w-full rounded-lg bg-[var(--primary-container)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                disabled={
                  isSaving ||
                  selectedWorkspace?.role === "guest" ||
                  dueDate === (ticket.due_date ?? "")
                }
                onClick={() => void saveDueDate()}
                type="button"
              >
                Save due date
              </button>
            </section>

            {canDelete ? (
              <section className="rounded-xl border border-[var(--error)]/25 bg-[var(--error)]/5 p-5">
                <h2 className="text-xs font-semibold uppercase text-[var(--error)]">
                  Danger zone
                </h2>
                <button
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--error)]/40 px-3 py-2 text-xs font-semibold text-[var(--error)]"
                  onClick={() => setShowDelete(true)}
                  type="button"
                >
                  <Trash2 size={14} /> Delete Ticket
                </button>
              </section>
            ) : null}
          </aside>
        </div>
      </main>

      {showDelete ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isSaving) {
              setShowDelete(false);
            }
          }}
        >
          <section
            aria-labelledby="delete-ticket-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl border border-[var(--error)]/40 bg-[var(--surface-container-lowest)] p-6 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <AlertTriangle
                  className="mt-0.5 text-[var(--error)]"
                  size={20}
                />
                <div>
                  <h2 className="text-lg font-semibold" id="delete-ticket-title">
                    Delete {ticket.reference}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
                    Type the confirmation text exactly to continue.
                  </p>
                </div>
              </div>
              <button
                aria-label="Close"
                disabled={isSaving}
                onClick={() => setShowDelete(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold">
              Type{" "}
              <strong className="break-all text-[var(--error)]">
                {confirmationTarget}
              </strong>
              <input
                autoComplete="off"
                autoFocus
                className="mt-2 h-11 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-3 text-sm"
                onChange={(event) =>
                  setDeleteConfirmation(event.target.value)
                }
                value={deleteConfirmation}
              />
            </label>
            <button
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--error)] px-4 py-3 text-xs font-semibold text-white disabled:opacity-40"
              disabled={
                isSaving || deleteConfirmation !== confirmationTarget
              }
              onClick={() => void handleDelete()}
              type="button"
            >
              <Trash2 size={14} /> Delete this Ticket
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
