"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useWorkspaces } from "@/app/components/workspace-provider";
import {
  createTicket,
  getProjects,
  type Project,
  type TopicPriority,
} from "@/lib/api";

export function CreateTicketForm() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaces();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectUid, setProjectUid] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TopicPriority>("medium");
  const [estimate, setEstimate] = useState("60");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!selectedWorkspace) return;
    let active = true;
    getProjects(selectedWorkspace.slug)
      .then((data) => {
        if (!active) return;
        const available = data.filter((project) => project.is_active);
        setProjects(available);
        setProjectUid(available[0]?.uid ?? "");
      })
      .catch(() => {
        if (active) setError("Unable to load Projects.");
      });
    return () => {
      active = false;
    };
  }, [selectedWorkspace]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !selectedWorkspace ||
      !projectUid ||
      !title.trim() ||
      !description.trim()
    ) {
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const ticket = await createTicket(selectedWorkspace.slug, {
        project_uid: projectUid,
        title: title.trim(),
        description: description.trim(),
        priority,
        estimated_minutes: Number(estimate) || 0,
        due_date: dueDate || null,
      });
      router.push(`/tickets/${ticket.reference}`);
    } catch {
      setError("Unable to create the Ticket.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">
              Board card
            </p>
            <h1 className="text-3xl font-semibold">Create Ticket</h1>
            <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
              Every Ticket must be assigned to a Project.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-[var(--on-surface-variant)]"
            href="/board"
          >
            Cancel
          </Link>
        </header>

        {error ? (
          <p
            className="mb-5 rounded-lg border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <form
          className="space-y-5 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 sm:p-7"
          onSubmit={handleSubmit}
        >
          <Field label="Project" required>
            <select
              className={inputClass}
              onChange={(event) => setProjectUid(event.target.value)}
              required
              value={projectUid}
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.uid} value={project.uid}>
                  {project.key} — {project.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Title" required>
            <input
              autoFocus
              className={inputClass}
              maxLength={255}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A specific piece of work"
              required
              value={title}
            />
          </Field>

          <Field label="Description" required>
            <textarea
              className={`${inputClass} min-h-40 resize-y leading-6`}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what this card must solve or deliver."
              required
              value={description}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Priority">
              <select
                className={inputClass}
                onChange={(event) =>
                  setPriority(event.target.value as TopicPriority)
                }
                value={priority}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>
            <Field label="Estimate (minutes)">
              <input
                className={inputClass}
                min="0"
                onChange={(event) => setEstimate(event.target.value)}
                type="number"
                value={estimate}
              />
            </Field>
            <Field label="Due date">
              <input
                className={inputClass}
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
            </Field>
          </div>

          {!projects.length ? (
            <p className="text-xs text-[var(--warning)]">
              Create a Project before creating a Ticket.
            </p>
          ) : null}

          <button
            className="w-full rounded-xl bg-[var(--primary-container)] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-40"
            disabled={
              submitting ||
              !projectUid ||
              !title.trim() ||
              !description.trim()
            }
            type="submit"
          >
            {submitting ? "Creating…" : "Create Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface)] px-4 py-3 text-sm outline-none placeholder:text-[var(--outline)] focus:border-[var(--primary)]";

function Field({
  children,
  label,
  required,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      {required ? <span className="text-[var(--error)]"> *</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
