"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readCustomTickets, seedTickets, type Ticket } from "@/lib/ticket-data";

const statusStyles: Record<string, string> = {
  Open: "border-[var(--error)]/30 bg-[var(--error-container)]/20 text-[var(--error)]",
  "In Progress": "border-[var(--secondary)]/30 bg-[var(--secondary-container)]/20 text-[var(--secondary)]",
  Review: "border-[var(--tertiary)]/30 bg-[var(--tertiary-container)]/20 text-[var(--tertiary)]",
  Backlog: "border-[var(--outline)]/30 bg-[var(--surface-container-highest)]/30 text-[var(--on-surface-variant)]",
  Resolved: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
  Closed: "border-[var(--outline)]/30 bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]",
};

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>(seedTickets);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [assignee, setAssignee] = useState("All");
  const [tab, setTab] = useState("All Tickets");
  const [newestFirst, setNewestFirst] = useState(true);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setTickets([...readCustomTickets(), ...seedTickets]);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return tickets.filter((ticket) => {
      const matchesQuery =
        ticket.id.toLowerCase().includes(normalized) ||
        ticket.title.toLowerCase().includes(normalized);
      const matchesStatus = status === "All" || ticket.status === status;
      const matchesPriority = priority === "All" || ticket.priority === priority;
      const matchesAssignee = assignee === "All" || ticket.assignee === assignee;
      const matchesTab = tab !== "My Issues" || ticket.assignee === "John Doe";
      return matchesQuery && matchesStatus && matchesPriority && matchesAssignee && matchesTab;
    }).sort((left, right) => {
      const leftNumber = Number(left.id.replace(/\D/g, ""));
      const rightNumber = Number(right.id.replace(/\D/g, ""));
      return newestFirst ? rightNumber - leftNumber : leftNumber - rightNumber;
    });
  }, [assignee, newestFirst, priority, query, status, tab, tickets]);

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-hidden p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-fit items-center rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-1">
          {["All Tickets", "My Issues", "Backlog"].map((item) => (
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition sm:px-6 ${
                tab === item
                  ? "bg-[var(--secondary-container)] text-[var(--on-secondary-container)]"
                  : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-highest)]"
              }`}
              key={item}
              onClick={() => {
                setTab(item);
                if (item === "Backlog") setStatus("Backlog");
                else if (status === "Backlog") setStatus("All");
              }}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)]">
            Sort by:
          </span>
          <button className="rounded-lg border border-[var(--outline-variant)] px-3 py-2 text-sm hover:bg-[var(--surface-container-highest)]" onClick={() => setNewestFirst((value) => !value)} type="button">
            {newestFirst ? "Newest" : "Oldest"} ↕
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container)] p-4 md:grid-cols-4 lg:grid-cols-5">
        <label className="relative lg:col-span-2">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline)]">⌕</span>
          <span className="sr-only">Search tickets</span>
          <input
            className="w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] py-2.5 pl-10 pr-4 text-sm text-[var(--on-surface)] outline-none placeholder:text-[var(--outline)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ID or title..."
            type="search"
            value={query}
          />
        </label>
        <Filter
          label="Status"
          onChange={setStatus}
          options={["All", "Open", "In Progress", "Review", "Backlog", "Resolved", "Closed"]}
          value={status}
        />
        <Filter
          label="Priority"
          onChange={setPriority}
          options={["All", "Critical", "High", "Medium", "Low"]}
          value={priority}
        />
        <Filter
          label="Assignee"
          onChange={setAssignee}
          options={["All", "John Doe", "Jane Smith", "Ticket Bot", "Unassigned"]}
          value={assignee}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[var(--surface-container-high)]">
            <tr>
              {["ID", "Title & Priority", "Status", "Assignee", "Created", "Actions"].map(
                (heading) => (
                  <th
                    className={`px-6 py-4 font-mono text-[10px] uppercase tracking-wider text-[var(--outline)] ${
                      heading === "Actions" ? "text-right" : ""
                    }`}
                    key={heading}
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--outline-variant)]/60">
            {filtered.map((ticket) => (
              <tr className="group transition hover:bg-[var(--surface-container-high)]" key={ticket.id}>
                <td className="px-6 py-4 font-mono text-xs text-[var(--primary)]">
                  <Link href={`/tickets/${ticket.id}`}>
                    {ticket.id}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link className="flex items-center gap-3 font-medium" href={`/tickets/${ticket.id}`}>
                    <span
                      className={
                        ticket.priority === "Critical"
                          ? "font-bold text-[var(--error)]"
                          : ticket.priority === "High"
                            ? "font-bold text-[var(--primary)]"
                            : "text-[var(--on-surface-variant)]"
                      }
                    >
                      {ticket.priority === "Critical"
                        ? "!!"
                        : ticket.priority === "High"
                          ? "↑↑"
                          : ticket.priority === "Medium"
                            ? "—"
                            : "↓"}
                    </span>
                    {ticket.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-[var(--primary-container)] text-[9px] text-white">
                      {ticket.initials}
                    </span>
                    <span className="text-sm text-[var(--on-surface-variant)]">{ticket.assignee}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--on-surface-variant)]">{ticket.created}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-50 transition group-hover:opacity-100">
                    <Link
                      aria-label={`View ${ticket.id}`}
                      className="rounded p-2 text-[var(--primary)] hover:bg-[var(--primary)]/10"
                      href={`/tickets/${ticket.id}`}
                    >
                      ◉
                    </Link>
                    <Link aria-label={`Edit ${ticket.id}`} className="rounded p-2 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-highest)]" href={`/tickets/${ticket.id}?mode=edit`}>✎</Link>
                    <button aria-label={`Resolve ${ticket.id}`} className="rounded p-2 text-[var(--tertiary)] hover:bg-[var(--tertiary)]/10 disabled:opacity-30" disabled={ticket.status === "Resolved" || ticket.status === "Closed"} onClick={() => setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: "Resolved" } : item))} type="button">✓</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-6 py-16 text-center text-sm text-[var(--on-surface-variant)]" colSpan={6}>
                  No tickets match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between text-xs text-[var(--on-surface-variant)]">
        <p>
          Showing <strong className="text-[var(--on-surface)]">1–{filtered.length}</strong> of{" "}
          <strong className="text-[var(--on-surface)]">128</strong> tickets
        </p>
        <span className="font-mono text-[10px] text-[var(--outline)]">Page 1 of 1</span>
      </footer>
    </div>
  );
}

function Filter({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className="w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2.5 text-sm text-[var(--on-surface)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {label}: {option}
          </option>
        ))}
      </select>
    </label>
  );
}
