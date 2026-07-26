import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FolderKanban, Plus } from "lucide-react";
import { ProductShell } from "@/app/components/product-shell";
import { Avatar, PageHeader, ProgressBar } from "@/app/components/ui/product-ui";
import { projects } from "@/app/mocks/product-data";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <ProductShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <PageHeader
            actions={<Link className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary-container)]" href="/projects/new"><Plus size={15} /> New project</Link>}
            description="Manage ownership, delivery health, and ticket flow across product areas."
            eyebrow="Workspace portfolio"
            title="Projects"
          />
          <section className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link className="group rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--outline)]" href={`/projects/${project.key}`} key={project.key}>
                <div className="mb-5 flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-xl text-white" style={{ backgroundColor: project.color }}><FolderKanban size={19} /></span>
                  <ArrowUpRight className="text-[var(--outline)] transition group-hover:text-[var(--primary)]" size={17} />
                </div>
                <span className="font-mono text-[9px] text-[var(--outline)]">{project.key}</span>
                <h2 className="mt-1 text-lg font-semibold">{project.name}</h2>
                <p className="mt-2 min-h-10 text-xs leading-5 text-[var(--on-surface-variant)]">{project.description}</p>
                <div className="my-5 grid grid-cols-3 gap-3 border-y border-[var(--outline-variant)] py-4 text-center">
                  <ProjectStat label="Open tickets" value={project.open.toString()} />
                  <ProjectStat label="Members" value={project.members.toString()} />
                  <ProjectStat label="Health" value={`${project.health}%`} />
                </div>
                <div className="mb-3 flex items-center gap-2 text-xs">
                  <Avatar initials={project.lead.split(" ").map((part) => part[0]).join("")} name={project.lead} size="sm" />
                  <span className="text-[var(--on-surface-variant)]">Led by {project.lead}</span>
                </div>
                <ProgressBar tone={project.health > 85 ? "success" : "primary"} value={project.health} />
              </Link>
            ))}
          </section>
        </div>
      </div>
    </ProductShell>
  );
}

function ProjectStat({ label, value }: { label: string; value: string }) {
  return <div><strong className="block text-sm">{value}</strong><span className="text-[9px] text-[var(--outline)]">{label}</span></div>;
}
