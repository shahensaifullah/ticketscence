import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDot,
  Clock3,
  Gauge,
  Sparkles,
  TicketCheck,
  UserCheck,
} from "lucide-react";
import { ProductShell } from "@/app/components/product-shell";
import {
  Avatar,
  MetricCard,
  Panel,
  PriorityBadge,
  ProgressBar,
  StatusBadge,
} from "@/app/components/ui/product-ui";
import {
  dashboardMetrics,
  teamMembers,
  workspaceTickets,
} from "@/app/mocks/product-data";
import { WorkspaceDashboardSummary } from "@/app/components/dashboard/workspace-dashboard-summary";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "TicketSense operations overview.",
};

const metricIcons = [
  TicketCheck,
  CircleDot,
  Clock3,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Gauge,
  Sparkles,
];

export default function DashboardPage() {
  const attentionTickets = workspaceTickets.filter(
    (ticket) => ticket.priority === "Critical" || ticket.priority === "High",
  );

  return (
    <ProductShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <WorkspaceDashboardSummary />

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            {dashboardMetrics.map((metric, index) => (
              <MetricCard
                change={metric.change}
                icon={metricIcons[index]}
                key={metric.label}
                label={metric.label}
                tone={metric.tone as "primary" | "error" | "success" | "warning" | "tertiary"}
                value={metric.value}
              />
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <Panel
              description="Created and resolved over the last seven days"
              title="Ticket flow"
            >
              <div className="p-5">
                <div className="mb-5 flex items-center gap-5 text-[10px] text-[var(--outline)]">
                  <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[var(--primary-container)]" /> Created</span>
                  <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[var(--success)]" /> Resolved</span>
                </div>
                <div className="flex h-48 items-end gap-3 sm:gap-5">
                  {[
                    [54, 38],
                    [72, 58],
                    [46, 64],
                    [83, 71],
                    [68, 77],
                    [91, 74],
                    [64, 88],
                  ].map(([created, resolved], index) => (
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={index}>
                      <div className="flex h-40 w-full items-end justify-center gap-1 sm:gap-2">
                        <span className="w-2.5 rounded-t bg-[var(--primary-container)] sm:w-4" style={{ height: `${created}%` }} />
                        <span className="w-2.5 rounded-t bg-[var(--success)] sm:w-4" style={{ height: `${resolved}%` }} />
                      </div>
                      <span className="font-mono text-[9px] text-[var(--outline)]">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <section className="ai-panel rounded-xl p-5">
              <div className="mb-5 flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--primary-container)] text-[var(--on-primary-container)]">
                  <Bot aria-hidden="true" size={19} />
                </span>
                <span className="rounded-full bg-[var(--surface-container)] px-2 py-1 font-mono text-[9px] text-[var(--tertiary)]">LIVE</span>
              </div>
              <h2 className="text-lg font-semibold">AI operations brief</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--on-surface-variant)]">
                Four high-priority tickets share the same authentication dependency.
                Resolving TS-101 may unblock two related incidents and protect today&apos;s SLA.
              </p>
              <div className="my-5 space-y-3 border-y border-[var(--outline-variant)] py-4">
                <Insight label="Duplicate cluster" value="3 tickets" />
                <Insight label="Estimated time saved" value="6.5 hours" />
                <Insight label="Recommended owner" value="John Doe" />
              </div>
              <Link className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)] hover:underline" href="/assistant">
                Investigate with AI <span aria-hidden="true">→</span>
              </Link>
            </section>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
            <Panel title="Needs attention" description="High-impact work ordered by urgency">
              <div className="divide-y divide-[var(--outline-variant)]">
                {attentionTickets.map((ticket) => (
                  <Link className="grid gap-3 px-5 py-4 transition hover:bg-[var(--surface-container-high)] sm:grid-cols-[92px_minmax(0,1fr)_110px_80px] sm:items-center" href={`/tickets/${ticket.id}`} key={ticket.id}>
                    <span className="font-mono text-[10px] font-semibold text-[var(--primary)]">{ticket.id}</span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm">{ticket.title}</strong>
                      <span className="mt-1 block truncate text-[10px] text-[var(--outline)]">{ticket.project} · Due {ticket.due}</span>
                    </span>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel title="Team workload" description="Current assignment capacity">
              <div className="space-y-4 p-5">
                {teamMembers.slice(0, 4).map((member) => (
                  <div key={member.name}>
                    <div className="mb-2 flex items-center gap-3">
                      <Avatar initials={member.initials} name={member.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-xs">{member.name}</strong>
                        <span className="text-[10px] text-[var(--outline)]">{member.assigned} assigned</span>
                      </span>
                      <span className="font-mono text-[9px] text-[var(--outline)]">{member.capacity}%</span>
                    </div>
                    <ProgressBar tone={member.capacity > 85 ? "warning" : "primary"} value={member.capacity} />
                  </div>
                ))}
                <Link className="block pt-1 text-center text-xs font-semibold text-[var(--primary)] hover:underline" href="/team">
                  View team capacity
                </Link>
              </div>
            </Panel>
          </section>
        </div>
      </div>
    </ProductShell>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-[var(--on-surface-variant)]">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
