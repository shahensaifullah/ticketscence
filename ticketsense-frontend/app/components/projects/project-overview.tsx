"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Columns3,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
} from "@/app/components/ui/product-ui";
import { useWorkspaces } from "@/app/components/workspace-provider";
import { getProject, type ProjectDetail } from "@/lib/api";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatMinutes(minutes: number) {
  return formatDuration(minutes * 60);
}

export function ProjectOverview({ projectKey }: { projectKey: string }) {
  const { selectedWorkspace } = useWorkspaces();
  const [project, setProject] = useState<ProjectDetail>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!selectedWorkspace) return;
    let active = true;
    getProject(selectedWorkspace.slug, projectKey)
      .then((data) => {
        if (active) setProject(data);
      })
      .catch(() => {
        if (active) setError("Unable to load this project.");
      });
    return () => {
      active = false;
    };
  }, [projectKey, selectedWorkspace]);

  if (error) {
    return (
      <div className="flex-1 p-8">
        <p className="rounded-lg border border-[var(--error)]/35 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">
          {error}
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 p-8 text-sm text-[var(--outline)]">
        Loading project…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <Link
          className="inline-flex items-center gap-2 text-xs text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
          href="/projects"
        >
          <ArrowLeft size={14} /> All projects
        </Link>
        <PageHeader
          actions={
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--outline-variant)] px-3 py-2 text-xs font-semibold"
              href={`/board?project=${project.uid}`}
            >
              <Columns3 size={14} /> Open project Tickets
            </Link>
          }
          description={project.description || "No description yet."}
          eyebrow={`${project.key} · ${project.status.replaceAll("_", " ")}`}
          title={project.name}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={<Columns3 size={15} />}
            label="Open tickets"
            value={project.metrics.open_ticket_count.toString()}
          />
          <Metric
            icon={<Users size={15} />}
            label="Members working"
            value={project.metrics.member_count.toString()}
          />
          <Metric
            icon={<Clock3 size={15} />}
            label="Total tracked"
            value={formatDuration(project.metrics.total_tracked_seconds)}
          />
          <Metric
            icon={<CalendarDays size={15} />}
            label="Ticket estimate remaining"
            value={formatMinutes(
              project.metrics.remaining_estimated_minutes,
            )}
          />
        </section>

        <Panel
          description={`${project.metrics.completed_ticket_count} of ${project.metrics.ticket_count} Tickets complete`}
          title="Delivery progress"
        >
          <div className="space-y-3 p-5">
            <div className="flex justify-between text-xs">
              <span>
                Lead: {project.lead_name ?? "Not assigned"}
              </span>
              <strong>{project.metrics.progress_percent}%</strong>
            </div>
            <ProgressBar
              tone={
                project.metrics.progress_percent === 100
                  ? "success"
                  : "primary"
              }
              value={project.metrics.progress_percent}
            />
            <p className="text-[10px] text-[var(--outline)]">
              {project.start_date ?? "No start date"} →{" "}
              {project.target_date ?? "No target date"} ·{" "}
              {project.topic_count} linked Topics
            </p>
          </div>
        </Panel>

        <Panel
          description="Workspace members currently participating in this project"
          title="Project members"
        >
          <div className="flex flex-wrap gap-2 p-5">
            {project.members.map((member) => (
              <span
                className="rounded-full bg-[var(--surface-container-high)] px-3 py-1.5 text-xs"
                key={member.user_uid}
                title={member.email}
              >
                {member.name}
              </span>
            ))}
          </div>
        </Panel>

        <Panel
          description="All Tickets assigned to this project"
          title="Project tickets"
        >
          <div className="divide-y divide-[var(--outline-variant)]">
            {project.tickets.map((ticket) => (
              <Link
                className="grid gap-2 px-5 py-4 hover:bg-[var(--surface-container-high)] sm:grid-cols-[90px_minmax(0,1fr)_120px_110px] sm:items-center"
                href={`/tickets/${ticket.reference}`}
                key={ticket.uid}
              >
                <span className="font-mono text-[10px] text-[var(--primary)]">
                  {ticket.reference}
                </span>
                <strong className="text-sm">{ticket.title}</strong>
                <span className="text-[10px] text-[var(--outline)]">
                  {formatDuration(ticket.total_tracked_seconds)}
                </span>
                <StatusBadge status={ticket.status} />
              </Link>
            ))}
            {!project.tickets.length ? (
              <p className="p-5 text-sm text-[var(--outline)]">
                No Tickets in this project yet.
              </p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Panel className="p-5">
      <span className="flex items-center gap-2 text-xs text-[var(--outline)]">
        {icon} {label}
      </span>
      <strong className="mt-2 block text-3xl">{value}</strong>
    </Panel>
  );
}
