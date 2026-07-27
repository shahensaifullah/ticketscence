"use client";

import { Clock3, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaces } from "@/app/components/workspace-provider";
import {
  getActiveTicketTimer,
  heartbeatTicketTimer,
  stopTicketTimer,
  type BoardTicket,
} from "@/lib/api";

export const timerChangedEvent = "ticketsense:timer-changed";

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}

export function GlobalTimerWidget() {
  const router = useRouter();
  const { selectedWorkspace, selectWorkspace } = useWorkspaces();
  const [ticket, setTicket] = useState<BoardTicket | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string>();
  const activeTimerUid = ticket?.active_timer?.uid;

  const loadActiveTimer = useCallback(async () => {
    if (!selectedWorkspace) {
      setTicket(null);
      return;
    }
    try {
      const active = await getActiveTicketTimer(selectedWorkspace.slug);
      setTicket(active);
      setError(undefined);
    } catch {
      setError("Timer sync failed");
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    void loadActiveTimer();
    const poll = window.setInterval(() => void loadActiveTimer(), 10_000);
    const handleChange = () => void loadActiveTimer();
    window.addEventListener(timerChangedEvent, handleChange);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener(timerChangedEvent, handleChange);
    };
  }, [loadActiveTimer]);

  useEffect(() => {
    if (!ticket?.active_timer) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [activeTimerUid]);

  useEffect(() => {
    if (!selectedWorkspace || !ticket?.active_timer) return;
    const heartbeat = window.setInterval(() => {
      heartbeatTicketTimer(
        ticket.organization_slug,
        ticket.reference,
      )
        .then((updated) => {
          setTicket(updated);
          setError(undefined);
        })
        .catch(() => setError("Timer sync failed"));
    }, 15_000);
    return () => window.clearInterval(heartbeat);
  }, [activeTimerUid, selectedWorkspace, ticket?.reference]);

  const elapsedSeconds = useMemo(() => {
    const timer = ticket?.active_timer;
    if (!timer) return 0;
    return Math.max(
      timer.progress_seconds,
      Math.floor((now - new Date(timer.started_at).getTime()) / 1000),
    );
  }, [now, ticket?.active_timer]);

  async function stopTimer() {
    if (!selectedWorkspace || !ticket) return;
    setIsStopping(true);
    setError(undefined);
    try {
      await stopTicketTimer(
        ticket.organization_slug,
        ticket.reference,
      );
      setTicket(null);
      window.dispatchEvent(new Event(timerChangedEvent));
    } catch {
      setError("Unable to stop timer");
    } finally {
      setIsStopping(false);
    }
  }

  async function openTicket() {
    if (!ticket) return;
    if (selectedWorkspace?.slug !== ticket.organization_slug) {
      await selectWorkspace(ticket.organization_slug);
    }
    router.push(`/tickets/${ticket.reference}`);
  }

  if (!ticket?.active_timer) return null;

  return (
    <aside
      aria-label={`Running timer for ${ticket.reference}`}
      className="fixed bottom-4 right-4 z-50 w-[min(290px,calc(100vw-2rem))] rounded-xl border border-[var(--primary)]/40 bg-[var(--surface-container-lowest)] p-3 shadow-2xl"
    >
      <div className="flex items-center gap-3">
        <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
          <Clock3 size={16} />
          <span className="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-[var(--success)]" />
        </span>
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => void openTicket()}
          type="button"
        >
          <span className="block truncate text-[10px] font-semibold text-[var(--primary)]">
            {ticket.reference} · Timer running
          </span>
          <strong className="mt-0.5 block font-mono text-lg">
            {formatDuration(elapsedSeconds)}
          </strong>
        </button>
        <button
          aria-label={`Stop timer for ${ticket.reference}`}
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--error)] text-white disabled:opacity-40"
          disabled={isStopping}
          onClick={() => void stopTimer()}
          title="Stop and save this time session"
          type="button"
        >
          <Square size={13} />
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-[10px] text-[var(--error)]">{error}</p>
      ) : null}
    </aside>
  );
}
