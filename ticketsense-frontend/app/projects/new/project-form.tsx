"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PageHeader } from "../../components/ui/product-ui";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-sm outline-none focus:border-[var(--primary)]";

export function NewProjectForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    window.setTimeout(() => router.push("/projects"), 400);
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          description="Define ownership and defaults for a new stream of work."
          eyebrow="Workspace project"
          title="Create project"
        />
        <form
          className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)]"
          onSubmit={submit}
        >
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <label className="text-xs font-medium sm:col-span-2">
              Project name
              <input autoFocus className={inputClass} placeholder="e.g. Mobile Experience" required />
            </label>
            <label className="text-xs font-medium">
              Project key
              <input className={inputClass} maxLength={8} placeholder="MOBILE" required />
            </label>
            <label className="text-xs font-medium">
              Project lead
              <select className={inputClass}>
                <option>Alex Morgan</option>
                <option>John Doe</option>
                <option>Elena Rodriguez</option>
              </select>
            </label>
            <label className="text-xs font-medium sm:col-span-2">
              Description
              <textarea className="mt-2 min-h-28 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 text-sm outline-none focus:border-[var(--primary)]" placeholder="What work belongs in this project?" required />
            </label>
            <label className="text-xs font-medium">
              Default assignee
              <select className={inputClass}><option>Unassigned</option><option>Project lead</option></select>
            </label>
            <label className="text-xs font-medium">
              Default ticket type
              <select className={inputClass}><option>Task</option><option>Bug</option><option>Feature</option></select>
            </label>
          </div>
          <footer className="flex justify-end gap-2 border-t border-[var(--outline-variant)] p-4">
            <button className="rounded-lg border border-[var(--outline-variant)] px-4 py-2.5 text-xs font-semibold" onClick={() => router.back()} type="button">Cancel</button>
            <button className="rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)] disabled:opacity-50" disabled={saving} type="submit">{saving ? "Creating…" : "Create project"}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}
