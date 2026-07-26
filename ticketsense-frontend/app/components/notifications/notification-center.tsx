"use client";

import { Bell, Bot, CheckCheck, Clock3, MessageSquare, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/app/components/ui/product-ui";
import { notifications as initialNotifications } from "@/app/mocks/product-data";

const icons = {
  assignment: UserCheck,
  mention: MessageSquare,
  sla: Clock3,
  ai: Bot,
  status: CheckCheck,
  project: Bell,
};

export function NotificationCenter() {
  const [items, setItems] = useState(initialNotifications);
  const unread = items.filter((item) => item.unread).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader actions={<button className="inline-flex items-center gap-2 rounded-lg border border-[var(--outline-variant)] px-3 py-2 text-xs font-semibold disabled:opacity-40" disabled={!unread} onClick={() => setItems((current) => current.map((item) => ({ ...item, unread: false })))} type="button"><CheckCheck size={14} /> Mark all read</button>} description="Assignments, mentions, service warnings, and AI recommendations." eyebrow={`${unread} unread`} title="Notifications" />
        <div className="flex items-center gap-2">
          {["All", "Unread", "Assignments", "AI updates"].map((filter, index) => <button className={`rounded-lg px-3 py-2 text-xs font-semibold ${index === 0 ? "bg-[var(--secondary-container)] text-[var(--on-secondary-container)]" : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"}`} key={filter} type="button">{filter}</button>)}
        </div>
        <section className="overflow-hidden rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
          {items.map((item) => {
            const Icon = icons[item.type as keyof typeof icons] ?? Bell;
            return <article className={`group flex gap-4 border-b border-[var(--outline-variant)] p-5 last:border-0 ${item.unread ? "bg-[color-mix(in_srgb,var(--primary-container)_5%,transparent)]" : ""}`} key={item.id}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-container-high)] text-[var(--primary)]"><Icon size={17} /></span><button className="min-w-0 flex-1 text-left" onClick={() => setItems((current) => current.map((notification) => notification.id === item.id ? { ...notification, unread: false } : notification))} type="button"><span className="flex items-center gap-2"><strong className="truncate text-sm">{item.title}</strong>{item.unread && <i className="size-2 shrink-0 rounded-full bg-[var(--primary-container)]" />}</span><span className="mt-1 block text-xs text-[var(--on-surface-variant)]">{item.detail}</span><span className="mt-2 block font-mono text-[9px] text-[var(--outline)]">{item.time}</span></button><button aria-label={`Delete ${item.title}`} className="grid size-8 place-items-center rounded-lg text-[var(--outline)] opacity-0 hover:bg-[var(--surface-container-high)] hover:text-[var(--error)] group-hover:opacity-100" onClick={() => setItems((current) => current.filter((notification) => notification.id !== item.id))} type="button"><Trash2 size={14} /></button></article>;
          })}
        </section>
      </div>
    </div>
  );
}
