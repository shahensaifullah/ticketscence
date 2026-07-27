"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/app/components/ui/product-ui";
import { useWorkspaces } from "@/app/components/workspace-provider";
import {
  createProject,
  getWorkspaceDashboard,
  type ProjectStatus,
  type TopicPriority,
  type WorkspaceMember,
} from "@/lib/api";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-sm outline-none focus:border-[var(--primary)]";

export function NewProjectForm() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaces();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planned");
  const [priority, setPriority] = useState<TopicPriority | "">("");
  const [leadUid, setLeadUid] = useState("");
  const [memberUids, setMemberUids] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState("#6750A4");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!selectedWorkspace) return;
    let active = true;
    getWorkspaceDashboard(selectedWorkspace.slug)
      .then((dashboard) => {
        if (!active) return;
        setMembers(
          dashboard.members.filter((member) => member.role !== "guest"),
        );
      })
      .catch(() => {
        if (active) setError("Unable to load workspace members.");
      });
    return () => {
      active = false;
    };
  }, [selectedWorkspace]);

  function toggleMember(uid: string) {
    setMemberUids((current) =>
      current.includes(uid)
        ? current.filter((item) => item !== uid)
        : [...current, uid],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkspace) return;
    setSaving(true);
    setError(undefined);
    try {
      const project = await createProject(selectedWorkspace.slug, {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        status,
        priority: priority || null,
        lead_uid: leadUid || null,
        member_user_uids: memberUids,
        start_date: startDate || null,
        target_date: targetDate || null,
        color,
      });
      router.push(`/projects/${project.key}`);
    } catch {
      setError(
        "Unable to create the project. Check the key, dates, and members.",
      );
    } finally {
      setSaving(false);
    }
  }

  const canManage =
    selectedWorkspace?.role === "owner" ||
    selectedWorkspace?.role === "admin";

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          description="Define the project scope, ownership, schedule, and people who will work on its Tickets."
          eyebrow={selectedWorkspace?.name ?? "Workspace project"}
          title="Create project"
        />

        {error ? (
          <p className="rounded-lg border border-[var(--error)]/35 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">
            {error}
          </p>
        ) : null}

        {!canManage ? (
          <p className="rounded-lg border border-[var(--warning)]/35 bg-[var(--warning)]/10 px-4 py-3 text-sm">
            Only workspace Owners and Admins can create projects.
          </p>
        ) : (
          <form
            className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)]"
            onSubmit={submit}
          >
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <label className="text-xs font-medium sm:col-span-2">
                Project title
                <input
                  autoFocus
                  className={inputClass}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Mobile Experience"
                  required
                  value={name}
                />
              </label>
              <label className="text-xs font-medium">
                Project key
                <input
                  className={inputClass}
                  maxLength={20}
                  onChange={(event) =>
                    setKey(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_-]/g, ""),
                    )
                  }
                  pattern="[A-Za-z][A-Za-z0-9_-]{1,19}"
                  placeholder="MOBILE"
                  required
                  value={key}
                />
              </label>
              <label className="text-xs font-medium">
                Project lead
                <select
                  className={inputClass}
                  onChange={(event) => setLeadUid(event.target.value)}
                  value={leadUid}
                >
                  <option value="">No lead</option>
                  {members.map((member) => (
                    <option key={member.user_uid} value={member.user_uid}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium sm:col-span-2">
                Description
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 text-sm outline-none focus:border-[var(--primary)]"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What work belongs in this project?"
                  value={description}
                />
              </label>
              <label className="text-xs font-medium">
                Status
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setStatus(event.target.value as ProjectStatus)
                  }
                  value={status}
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In progress</option>
                  <option value="on_hold">On hold</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="text-xs font-medium">
                Priority
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setPriority(event.target.value as TopicPriority | "")
                  }
                  value={priority}
                >
                  <option value="">No priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className="text-xs font-medium">
                Start date
                <input
                  className={inputClass}
                  onChange={(event) => setStartDate(event.target.value)}
                  type="date"
                  value={startDate}
                />
              </label>
              <label className="text-xs font-medium">
                Target date
                <input
                  className={inputClass}
                  min={startDate || undefined}
                  onChange={(event) => setTargetDate(event.target.value)}
                  type="date"
                  value={targetDate}
                />
              </label>
              <label className="text-xs font-medium">
                Project color
                <input
                  className={`${inputClass} p-1`}
                  onChange={(event) => setColor(event.target.value)}
                  type="color"
                  value={color}
                />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="text-xs font-medium">
                  Project members
                </legend>
                <div className="mt-2 grid gap-2 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 sm:grid-cols-2">
                  {members.map((member) => (
                    <label
                      className="flex items-center gap-2 text-xs"
                      key={member.user_uid}
                    >
                      <input
                        checked={memberUids.includes(member.user_uid)}
                        onChange={() => toggleMember(member.user_uid)}
                        type="checkbox"
                      />
                      {member.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <footer className="flex justify-end gap-2 border-t border-[var(--outline-variant)] p-4">
              <button
                className="rounded-lg border border-[var(--outline-variant)] px-4 py-2.5 text-xs font-semibold"
                onClick={() => router.back()}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)] disabled:opacity-50"
                disabled={saving}
                type="submit"
              >
                {saving ? "Creating…" : "Create project"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
