import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Columns3, Settings } from "lucide-react";
import { ProductShell } from "@/app/components/product-shell";
import {
  Panel,
  PageHeader,
  ProgressBar,
  StatusBadge,
} from "@/app/components/ui/product-ui";
import { projects, workspaceTickets } from "@/app/mocks/product-data";

export default async function ProjectPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const project = projects.find((item) => item.key === key.toUpperCase());
  if (!project) notFound();
  const tickets = workspaceTickets.filter((ticket) => ticket.projectKey === project.key);

  return (
    <ProductShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <Link className="inline-flex items-center gap-2 text-xs text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]" href="/projects"><ArrowLeft size={14} /> All projects</Link>
          <PageHeader actions={<><Link className="inline-flex items-center gap-2 rounded-lg border border-[var(--outline-variant)] px-3 py-2 text-xs font-semibold" href="/board"><Columns3 size={14} /> Open board</Link><button className="inline-flex items-center gap-2 rounded-lg border border-[var(--outline-variant)] px-3 py-2 text-xs font-semibold" type="button"><Settings size={14} /> Settings</button></>} description={project.description} eyebrow={project.key} title={project.name} />
          <section className="grid gap-4 lg:grid-cols-3">
            <Panel className="p-5"><span className="text-xs text-[var(--outline)]">Open tickets</span><strong className="mt-2 block text-3xl">{project.open}</strong></Panel>
            <Panel className="p-5"><span className="text-xs text-[var(--outline)]">Members</span><strong className="mt-2 block text-3xl">{project.members}</strong></Panel>
            <Panel className="p-5"><span className="text-xs text-[var(--outline)]">Delivery health</span><strong className="my-2 block text-3xl">{project.health}%</strong><ProgressBar tone="success" value={project.health} /></Panel>
          </section>
          <Panel title="Project tickets" description="The most recent work in this project">
            <div className="divide-y divide-[var(--outline-variant)]">
              {tickets.map((ticket) => <Link className="grid gap-2 px-5 py-4 hover:bg-[var(--surface-container-high)] sm:grid-cols-[90px_minmax(0,1fr)_110px] sm:items-center" href={`/tickets/${ticket.id}`} key={ticket.id}><span className="font-mono text-[10px] text-[var(--primary)]">{ticket.id}</span><strong className="text-sm">{ticket.title}</strong><StatusBadge status={ticket.status} /></Link>)}
            </div>
          </Panel>
        </div>
      </div>
    </ProductShell>
  );
}
