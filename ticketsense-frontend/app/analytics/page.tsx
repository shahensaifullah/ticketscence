import type { Metadata } from "next";
import { Activity, Bot, CheckCircle2, Clock3, Download, Gauge, RefreshCw, TicketCheck } from "lucide-react";
import { ProductShell } from "../components/product-shell";
import { MetricCard, Panel, PageHeader, ProgressBar } from "../components/ui/product-ui";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <ProductShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <PageHeader actions={<><a className="inline-flex items-center gap-2 rounded-lg border border-[var(--outline-variant)] px-3 py-2 text-xs font-semibold" href="/analytics"><RefreshCw size={14} /> Refresh</a><a className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-3 py-2 text-xs font-semibold text-[var(--on-primary-container)]" download="ticketsense-report.csv" href="data:text/csv;charset=utf-8,Metric%2CValue%0ATickets%20created%2C384%0ATickets%20resolved%2C352%0ASLA%20compliance%2C94.6%25"><Download size={14} /> Export report</a></>} description="Measure ticket flow, service quality, team capacity, and AI adoption." eyebrow="Last 30 days · All projects" title="Analytics" />
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard change="+12%" icon={TicketCheck} label="Tickets created" value="384" />
            <MetricCard change="+18%" icon={CheckCircle2} label="Tickets resolved" tone="success" value="352" />
            <MetricCard change="-22 min" icon={Clock3} label="Average first response" tone="tertiary" value="1h 08m" />
            <MetricCard change="+2.1%" icon={Gauge} label="SLA compliance" tone="success" value="94.6%" />
          </section>
          <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Panel title="Resolution trend" description="Weekly created versus resolved tickets">
              <div className="flex h-64 items-end gap-3 p-5">
                {[48, 62, 54, 78, 72, 88, 81, 93, 76, 86, 91, 96].map((value, index) => <div className="group relative flex min-w-0 flex-1 items-end" key={index}><div className="w-full rounded-t bg-[var(--primary-container)] opacity-80 transition group-hover:opacity-100" style={{ height: `${value}%` }} /><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-[var(--outline)]">{index + 1}</span></div>)}
              </div>
            </Panel>
            <Panel title="Ticket distribution" description="Current status mix">
              <div className="space-y-5 p-5">
                <ProgressBar label="Resolved" tone="success" value={52} />
                <ProgressBar label="In progress" value={21} />
                <ProgressBar label="Open" tone="error" value={15} />
                <ProgressBar label="In review" tone="tertiary" value={8} />
                <ProgressBar label="Backlog" value={4} />
              </div>
            </Panel>
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            <InsightCard icon={Activity} label="Resolution rate" value="91.7%" detail="32 more tickets resolved than last month" />
            <InsightCard icon={Bot} label="AI acceptance rate" value="68%" detail="Recommendations accepted by agents" />
            <InsightCard icon={RefreshCw} label="Reopened tickets" value="4.2%" detail="Down 1.8% from last month" />
          </section>
        </div>
      </div>
    </ProductShell>
  );
}

function InsightCard({ detail, icon: Icon, label, value }: { detail: string; icon: typeof Activity; label: string; value: string }) {
  return <Panel className="p-5"><Icon className="mb-5 text-[var(--primary)]" size={20} /><span className="text-xs text-[var(--outline)]">{label}</span><strong className="my-2 block text-2xl">{value}</strong><p className="text-xs leading-5 text-[var(--on-surface-variant)]">{detail}</p></Panel>;
}
