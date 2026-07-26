import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock3, Plus } from "lucide-react";
import { ProductShell } from "@/app/components/product-shell";
import {
  Avatar,
  MetricCard,
  Panel,
  PageHeader,
  PriorityBadge,
  StatusBadge,
} from "@/app/components/ui/product-ui";
import { workspaceTickets } from "@/app/mocks/product-data";

export const metadata: Metadata = { title: "My Work" };

export default function MyWorkPage() {
  const assigned = workspaceTickets.filter((ticket) =>
    ["John Doe", "Jane Smith"].includes(ticket.assignee),
  );

  return (
    <ProductShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <PageHeader
            actions={
              <Link className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)]" href="/tickets/new">
                <Plus size={15} /> Create ticket
              </Link>
            }
            description="Your assigned work, deadlines, and recently completed tickets."
            eyebrow="Personal workspace"
            title="My Work"
          />
          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard change="3 due soon" icon={Clock3} label="Assigned tickets" value="12" />
            <MetricCard change="2 today" icon={CalendarClock} label="Due this week" tone="warning" value="5" />
            <MetricCard change="+8 this month" icon={CheckCircle2} label="Recently resolved" tone="success" value="38" />
          </section>
          <Panel title="Assigned to me" description="Ordered by priority and due date">
            <div className="divide-y divide-[var(--outline-variant)]">
              {assigned.map((ticket) => (
                <Link className="grid gap-3 px-5 py-4 hover:bg-[var(--surface-container-high)] md:grid-cols-[90px_minmax(0,1fr)_120px_90px_110px] md:items-center" href={`/tickets/${ticket.id}`} key={ticket.id}>
                  <span className="font-mono text-[10px] font-semibold text-[var(--primary)]">{ticket.id}</span>
                  <span>
                    <strong className="block text-sm">{ticket.title}</strong>
                    <span className="mt-1 block text-[10px] text-[var(--outline)]">{ticket.project}</span>
                  </span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="flex items-center gap-2 text-xs text-[var(--on-surface-variant)]">
                    <Avatar initials={ticket.assigneeInitials} name={ticket.assignee} size="sm" />
                    {ticket.due}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </ProductShell>
  );
}
