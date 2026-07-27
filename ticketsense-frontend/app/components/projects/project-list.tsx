"use client";

import Link from "next/link";
import { ArrowUpRight, FolderKanban, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, ProgressBar } from "@/app/components/ui/product-ui";
import { useWorkspaces } from "@/app/components/workspace-provider";
import { getProjects, type Project } from "@/lib/api";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function ProjectList() {
  const { selectedWorkspace } = useWorkspaces();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!selectedWorkspace) return;
    let active = true;
    getProjects(selectedWorkspace.slug)
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch(() => {
        if (active) setError("Unable to load projects.");
      });
    return () => {
      active = false;
    };
  }, [selectedWorkspace]);

  const canManage =
    selectedWorkspace?.role === "owner" ||
    selectedWorkspace?.role === "admin";

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <PageHeader
          actions={
            canManage ? (
              <Link
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)]"
                href="/projects/new"
              >
                <Plus size={15} /> New project
              </Link>
            ) : undefined
          }
          description="Projects group Topics, board Tickets, members, estimates, and tracked delivery time."
          eyebrow={selectedWorkspace?.name ?? "Workspace portfolio"}
          title="Projects"
        />

        {error ? (
          <p className="rounded-lg border border-[var(--error)]/35 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">
            {error}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              className="group rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--outline)]"
              href={`/projects/${project.key}`}
              key={project.uid}
            >
              <div className="mb-5 flex items-start justify-between">
                <span
                  className="grid size-11 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: project.color }}
                >
                  <FolderKanban size={19} />
                </span>
                <ArrowUpRight
                  className="text-[var(--outline)] transition group-hover:text-[var(--primary)]"
                  size={17}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-[var(--outline)]">
                  {project.key}
                </span>
                <span className="rounded-full bg-[var(--surface-container-high)] px-2 py-0.5 text-[9px] capitalize">
                  {project.status.replaceAll("_", " ")}
                </span>
              </div>
              <h2 className="mt-1 text-lg font-semibold">{project.name}</h2>
              <p className="mt-2 min-h-10 text-xs leading-5 text-[var(--on-surface-variant)]">
                {project.description || "No project description yet."}
              </p>
              <div className="my-5 grid grid-cols-3 gap-3 border-y border-[var(--outline-variant)] py-4 text-center">
                <ProjectStat
                  label="Open tickets"
                  value={project.metrics.open_ticket_count.toString()}
                />
                <ProjectStat
                  label="Members"
                  value={project.metrics.member_count.toString()}
                />
                <ProjectStat
                  label="Tracked"
                  value={formatDuration(
                    project.metrics.total_tracked_seconds,
                  )}
                />
              </div>
              <div className="mb-3 flex justify-between text-[10px] text-[var(--outline)]">
                <span>
                  Lead: {project.lead_name ?? "Not assigned"}
                </span>
                <span>{project.metrics.progress_percent}% complete</span>
              </div>
              <ProgressBar
                tone={
                  project.metrics.progress_percent === 100
                    ? "success"
                    : "primary"
                }
                value={project.metrics.progress_percent}
              />
            </Link>
          ))}
        </section>

        {!projects.length && !error ? (
          <div className="rounded-xl border border-dashed border-[var(--outline-variant)] p-10 text-center text-sm text-[var(--outline)]">
            No projects yet. Create one to organize Topics and board cards.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProjectStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <strong className="block text-sm">{value}</strong>
      <span className="text-[9px] text-[var(--outline)]">{label}</span>
    </div>
  );
}

