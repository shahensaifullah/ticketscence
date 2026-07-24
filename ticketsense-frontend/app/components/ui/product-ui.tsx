import Link from "next/link";
import {
  ArrowUpRight,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import type {
  WorkspacePriority,
  WorkspaceTicketStatus,
} from "../../mocks/product-data";

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: React.ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--primary)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--on-surface-variant)]">
          {description}
        </p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  children,
  className = "",
  description,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <section className={`rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] ${className}`}>
      {(title || description) && (
        <div className="border-b border-[var(--outline-variant)] px-5 py-4">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {description && <p className="mt-1 text-xs text-[var(--outline)]">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricCard({
  change,
  icon: Icon,
  label,
  tone = "primary",
  value,
}: {
  change: string;
  icon: LucideIcon;
  label: string;
  tone?: "primary" | "error" | "success" | "warning" | "tertiary";
  value: string;
}) {
  const toneText = {
    primary: "text-[var(--primary)]",
    error: "text-[var(--error)]",
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    tertiary: "text-[var(--tertiary)]",
  };

  return (
    <article className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--outline)]">
      <div className="mb-4 flex items-center justify-between">
        <span className={`metric-icon metric-icon-${tone}`}>
          <Icon aria-hidden="true" size={17} />
        </span>
        <span className={`text-[10px] font-semibold ${toneText[tone]}`}>{change}</span>
      </div>
      <strong className="block text-2xl font-semibold tracking-[-0.02em]">{value}</strong>
      <span className="mt-1 block text-xs text-[var(--on-surface-variant)]">{label}</span>
    </article>
  );
}

export function StatusBadge({ status }: { status: WorkspaceTicketStatus | string }) {
  const normalized = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status-badge status-${normalized}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: WorkspacePriority | string }) {
  return <span className={`priority-badge priority-${priority.toLowerCase()}`}>{priority}</span>;
}

export function Avatar({
  initials,
  name,
  size = "md",
}: {
  initials: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "size-6 text-[8px]",
    md: "size-8 text-[10px]",
    lg: "size-10 text-xs",
  };
  return (
    <span
      aria-label={name}
      className={`grid shrink-0 place-items-center rounded-full bg-[var(--secondary-container)] font-semibold text-[var(--on-secondary-container)] ${sizes[size]}`}
      title={name}
    >
      {initials}
    </span>
  );
}

export function ProgressBar({
  label,
  tone = "primary",
  value,
}: {
  label?: string;
  tone?: "primary" | "success" | "warning" | "error" | "tertiary";
  value: number;
}) {
  const toneBackground = {
    primary: "bg-[var(--primary)]",
    error: "bg-[var(--error)]",
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    tertiary: "bg-[var(--tertiary)]",
  };

  return (
    <div>
      {label && (
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-[var(--on-surface-variant)]">{label}</span>
          <span className="font-mono text-[10px]">{value}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-container-high)]">
        <div
          className={`h-full rounded-full ${toneBackground[tone]}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({
  actionHref,
  actionLabel,
  description,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
}) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <span className="mb-4 grid size-11 place-items-center rounded-xl bg-[var(--surface-container-high)] text-[var(--primary)]">
        <Inbox aria-hidden="true" size={20} />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--outline)]">{description}</p>
      {actionHref && actionLabel && (
        <Link className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)]" href={actionHref}>
          {actionLabel} <ArrowUpRight aria-hidden="true" size={14} />
        </Link>
      )}
    </div>
  );
}
