import type { Metadata } from "next";
import { Plus, Search, UserCheck, Users } from "lucide-react";
import { ProductShell } from "../components/product-shell";
import { Avatar, MetricCard, Panel, PageHeader, ProgressBar } from "../components/ui/product-ui";
import { teamMembers } from "../mocks/product-data";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <ProductShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <PageHeader actions={<a className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)]" href="mailto:?subject=Join%20our%20TicketSense%20workspace"><Plus size={15} /> Invite member</a>} description="Balance workloads, review activity, and manage workspace access." eyebrow="Acme Corp · 26 members" title="Team" />
          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard change="+2 this month" icon={Users} label="Active members" value="26" />
            <MetricCard change="4 available" icon={UserCheck} label="Support agents" tone="success" value="8" />
            <MetricCard change="Healthy" icon={Users} label="Average capacity" tone="tertiary" value="72%" />
          </section>
          <Panel>
            <div className="flex flex-col gap-3 border-b border-[var(--outline-variant)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold">Workspace members</h2>
              <label className="relative block w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--outline)]" size={14} /><span className="sr-only">Search members</span><input className="h-9 w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] pl-9 pr-3 text-xs outline-none" placeholder="Search members…" /></label>
            </div>
            <div className="divide-y divide-[var(--outline-variant)]">
              {teamMembers.map((member) => <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_120px_180px_100px] md:items-center" key={member.name}><div className="flex items-center gap-3"><Avatar initials={member.initials} name={member.name} size="lg" /><span><strong className="block text-sm">{member.name}</strong><span className="text-[10px] text-[var(--outline)]">{member.role}</span></span></div><span className={`w-fit rounded-full px-2 py-1 text-[9px] ${member.status === "At capacity" ? "bg-[var(--error-container)] text-[var(--error)]" : "bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]"}`}>{member.status}</span><div><div className="mb-2 flex justify-between font-mono text-[9px] text-[var(--outline)]"><span>{member.assigned} assigned</span><span>{member.capacity}%</span></div><ProgressBar tone={member.capacity > 85 ? "warning" : "primary"} value={member.capacity} /></div><span className="text-right text-xs text-[var(--on-surface-variant)]">{member.resolved} resolved</span></div>)}
            </div>
          </Panel>
        </div>
      </div>
    </ProductShell>
  );
}
