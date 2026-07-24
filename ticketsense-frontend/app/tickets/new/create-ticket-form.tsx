"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { readCustomTickets, saveCustomTicket, seedTickets, type Ticket } from "../ticket-data";

export function CreateTicketForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Ticket["priority"]>("Medium");
  const [type, setType] = useState<Ticket["type"]>("Task");
  const [labels, setLabels] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const aiSuggestion = useMemo(() => {
    const content = `${title} ${description}`.toLowerCase();
    if (!content.trim()) {
      return {
        priority: "Waiting for issue details",
        category: "AI will classify the issue as you type",
        confidence: "—",
      };
    }
    if (/(down|outage|production|critical|security|data loss)/.test(content)) {
      return { priority: "Critical", category: "Incident", confidence: "94%" };
    }
    if (/(bug|error|fail|broken|latency)/.test(content)) {
      return { priority: "High", category: "Bug", confidence: "88%" };
    }
    if (/(feature|request|support|add)/.test(content)) {
      return { priority: "Medium", category: "Feature", confidence: "82%" };
    }
    return { priority: "Medium", category: "Task", confidence: "76%" };
  }, [description, title]);

  function applyAiSuggestion() {
    if (aiSuggestion.priority !== "Waiting for issue details") {
      setPriority(aiSuggestion.priority as Ticket["priority"]);
      setType(aiSuggestion.category as Ticket["type"]);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const allIds = [...seedTickets, ...readCustomTickets()]
      .map((ticket) => Number(ticket.id.replace(/\D/g, "")))
      .filter(Number.isFinite);
    const id = `TS-${Math.max(104, ...allIds) + 1}`;
    const assigneeElement = event.currentTarget.elements.namedItem("assignee") as HTMLSelectElement;
    const projectElement = event.currentTarget.elements.namedItem("project") as HTMLSelectElement;
    const dueDateElement = event.currentTarget.elements.namedItem("dueDate") as HTMLInputElement;
    const assignee = assigneeElement.value;

    saveCustomTicket({
      id,
      title: title.trim(),
      description: description.trim(),
      project: projectElement.value,
      type,
      priority,
      status: "Open",
      assignee,
      initials:
        assignee === "Unassigned"
          ? "—"
          : assignee
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
      created: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
      dueDate: dueDateElement.value || undefined,
      labels: labels
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean),
    });

    router.push(`/tickets/${id}`);
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--tertiary)]">
              New support issue
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.02em]">Create issue</h1>
            <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
              Describe the problem clearly. TicketSense will classify and route it.
            </p>
          </div>
          <Link className="text-sm font-semibold text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]" href="/tickets">
            Cancel
          </Link>
        </header>

        <form className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 sm:p-6">
              <h2 className="mb-5 text-lg font-semibold">Issue details</h2>
              <div className="space-y-5">
                <Field label="Title" required>
                  <input
                    autoFocus
                    className={inputClass}
                    maxLength={140}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="A concise summary of the issue"
                    required
                    value={title}
                  />
                  <span className="mt-1 block text-right font-mono text-[9px] text-[var(--outline)]">
                    {title.length}/140
                  </span>
                </Field>
                <Field label="Description" required>
                  <textarea
                    className={`${inputClass} min-h-44 resize-y leading-6`}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What happened? Include the expected result, actual result, and steps to reproduce."
                    required
                    value={description}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 sm:p-6">
              <h2 className="mb-5 text-lg font-semibold">Classification and ownership</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Project">
                  <select className={inputClass} defaultValue="Backend Support" name="project">
                    <option>Backend Support</option>
                    <option>Platform</option>
                    <option>AI Operations</option>
                    <option>Analytics</option>
                    <option>Customer Experience</option>
                  </select>
                </Field>
                <Field label="Issue type">
                  <select
                    className={inputClass}
                    onChange={(event) => setType(event.target.value as Ticket["type"])}
                    value={type}
                  >
                    <option>Bug</option>
                    <option>Task</option>
                    <option>Feature</option>
                    <option>Incident</option>
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    className={inputClass}
                    onChange={(event) => setPriority(event.target.value as Ticket["priority"])}
                    value={priority}
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </Field>
                <Field label="Assignee">
                  <select className={inputClass} defaultValue="Unassigned" name="assignee">
                    <option>Unassigned</option>
                    <option>John Doe</option>
                    <option>Jane Smith</option>
                    <option>Elena Rodriguez</option>
                    <option>Ticket Bot</option>
                  </select>
                </Field>
                <Field label="Due date">
                  <input className={inputClass} name="dueDate" type="date" />
                </Field>
                <Field label="Labels">
                  <input
                    className={inputClass}
                    onChange={(event) => setLabels(event.target.value)}
                    placeholder="backend, auth, performance"
                    value={labels}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-xl border border-dashed border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 text-center">
              <span className="mx-auto mb-3 grid size-10 place-items-center rounded-lg bg-[var(--surface-container-highest)] text-[var(--primary)]">↑</span>
              <strong className="block text-sm">Add screenshots, logs, or documents</strong>
              <p className="mt-1 text-xs text-[var(--outline)]">Drag files here or choose from your computer</p>
              <label className="mt-4 inline-block cursor-pointer rounded-lg border border-[var(--outline-variant)] px-4 py-2 text-xs font-semibold hover:bg-[var(--surface-container-highest)]">
                Choose files
                <input className="sr-only" multiple type="file" />
              </label>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-0">
            <section className="ai-panel rounded-xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-[var(--primary-container)] text-white">✦</span>
                <div>
                  <h2 className="font-semibold">AI classification</h2>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--tertiary)]">Live analysis</p>
                </div>
              </div>
              <p className="mb-5 text-sm leading-5 text-[var(--on-surface-variant)]">{aiSuggestion.category}</p>
              <dl className="space-y-3 border-y border-[var(--outline-variant)] py-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--outline)]">Suggested priority</dt>
                  <dd className="font-semibold text-[var(--primary)]">{aiSuggestion.priority}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--outline)]">Confidence</dt>
                  <dd className="font-mono text-xs">{aiSuggestion.confidence}</dd>
                </div>
              </dl>
              <button
                className="mt-4 w-full rounded-lg border border-[var(--primary)]/30 px-4 py-2.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!title && !description}
                onClick={applyAiSuggestion}
                type="button"
              >
                Apply AI suggestion
              </button>
            </section>

            <section className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container)] p-5">
              <h2 className="mb-3 text-sm font-semibold">Before you create</h2>
              <ul className="space-y-2 text-xs leading-5 text-[var(--on-surface-variant)]">
                <li>• Include enough context to reproduce the issue.</li>
                <li>• Remove passwords, tokens, and customer secrets.</li>
                <li>• Add logs and screenshots when they help diagnosis.</li>
              </ul>
            </section>

            <button
              className="w-full rounded-xl bg-[var(--primary-container)] px-5 py-4 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting || !title.trim() || !description.trim()}
              type="submit"
            >
              {submitting ? "Creating issue…" : "Create issue"}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-3 text-sm text-[var(--on-surface)] outline-none placeholder:text-[var(--outline)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

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
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label} {required && <span className="text-[var(--error)]">*</span>}
      </span>
      {children}
    </label>
  );
}
