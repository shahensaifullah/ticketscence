import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Gauge,
  Layers3,
  MessageSquareText,
  Network,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { TicketMark } from "@/app/components/icons";

const features = [
  {
    icon: WandSparkles,
    title: "AI-powered triage",
    description:
      "Classify, summarize, and prioritize every request before it becomes team noise.",
    accent: "primary",
  },
  {
    icon: Network,
    title: "Connected issue context",
    description:
      "Surface duplicates, dependencies, and related incidents across projects automatically.",
    accent: "tertiary",
  },
  {
    icon: Building2,
    title: "Multi-workspace management",
    description:
      "Move between workspaces in one click while keeping dashboards, members, and work isolated.",
    accent: "success",
  },
  {
    icon: ShieldCheck,
    title: "Universal workspace access",
    description:
      "Control workspace access with Owner, Admin, Member, and Guest roles.",
    accent: "warning",
  },
  {
    icon: BarChart3,
    title: "Operational analytics",
    description:
      "Track ticket flow, SLA health, team capacity, and resolution trends in real time.",
    accent: "primary",
  },
  {
    icon: MessageSquareText,
    title: "One shared workspace",
    description:
      "Keep customer context, technical discussion, ownership, and decisions together.",
    accent: "tertiary",
  },
] as const;

const workflow = [
  {
    number: "01",
    title: "Capture every signal",
    description:
      "Bring requests, incidents, and internal work into one structured operating queue.",
  },
  {
    number: "02",
    title: "Let AI clarify the work",
    description:
      "TicketSense summarizes context, detects patterns, and recommends priority and ownership.",
  },
  {
    number: "03",
    title: "Resolve with confidence",
    description:
      "Teams act from a shared view while leaders track quality, workload, and outcomes.",
  },
];

const roles = [
  "Owner",
  "Admin",
  "Member",
  "Guest",
];

export function LandingPage() {
  return (
    <main className="marketing-page overflow-hidden bg-[#080b12] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] overflow-hidden">
        <div className="absolute left-1/2 top-[-420px] size-[900px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute right-[-160px] top-40 size-[480px] rounded-full bg-cyan-400/8 blur-[120px]" />
        <div className="marketing-grid absolute inset-0 opacity-40" />
      </div>

      <header className="relative z-40 border-b border-white/8 bg-[#080b12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-5 sm:px-8">
          <Link
            aria-label="TicketSense home"
            className="flex items-center gap-3"
            href="/"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white shadow-[0_8px_30px_rgba(37,99,235,0.4)]">
              <TicketMark className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-[-0.03em]">
              TicketSense
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="mx-auto hidden items-center gap-7 text-sm text-slate-400 md:flex"
          >
            <a className="transition hover:text-white" href="#features">
              Features
            </a>
            <a className="transition hover:text-white" href="#workflow">
              How it works
            </a>
            <a className="transition hover:text-white" href="#workspaces">
              Workspaces
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              className="hidden rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:block"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
              href="/register"
            >
              Start free
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-5 pb-22 pt-20 sm:px-8 sm:pt-28 lg:pb-30">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/8 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-blue-300">
              <Sparkles aria-hidden="true" size={12} />
              AI-powered issue operations
            </div>
            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-[82px]">
              Turn support noise into{" "}
              <span className="marketing-gradient-text">clear action.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-balance text-base leading-7 text-slate-400 sm:text-lg">
              TicketSense gives modern teams one intelligent workspace to
              prioritize issues, coordinate people, and resolve the work that
              matters most.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold shadow-[0_18px_50px_rgba(37,99,235,0.32)] transition hover:bg-blue-500 sm:w-auto"
                href="/register"
              >
                Create your workspace
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <a
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-6 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/7 sm:w-auto"
                href="#product"
              >
                See TicketSense in action
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
              {["Start in minutes", "No credit card", "Secure by design"].map(
                (item) => (
                  <span className="flex items-center gap-2" key={item}>
                    <Check
                      aria-hidden="true"
                      className="text-emerald-400"
                      size={13}
                    />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <ProductPreview />

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/8 bg-white/8 sm:grid-cols-4">
            {[
              ["94.6%", "SLA compliance"],
              ["32%", "Faster resolution"],
              ["6.5h", "Saved each week"],
              ["1 view", "Across every team"],
            ].map(([value, label]) => (
              <div
                className="bg-[#0b0f18] px-4 py-5 text-center"
                key={label}
              >
                <strong className="block text-xl tracking-[-0.03em] text-white">
                  {value}
                </strong>
                <span className="mt-1 block text-[11px] text-slate-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative border-y border-white/8 bg-white/[0.018] px-5 py-22 sm:px-8 lg:py-28"
        id="features"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Built for operational clarity"
            title="Everything your team needs to move work forward."
          >
            Replace scattered updates and reactive triage with one shared
            system that understands your work.
          </SectionHeading>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                className="group rounded-2xl border border-white/8 bg-[#0d111b] p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-400/20 hover:bg-[#101621]"
                key={feature.title}
              >
                <span
                  className={`marketing-feature-icon marketing-feature-${feature.accent}`}
                >
                  <feature.icon aria-hidden="true" size={19} />
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-[-0.025em]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative px-5 py-22 sm:px-8 lg:py-30"
        id="workflow"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="From signal to resolution"
            title="A calmer way to run issue operations."
          >
            TicketSense turns incoming demand into an understandable,
            prioritized flow your whole team can act on.
          </SectionHeading>

          <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
            <div className="absolute left-[16.66%] right-[16.66%] top-8 hidden h-px bg-gradient-to-r from-blue-500/20 via-blue-400/60 to-blue-500/20 lg:block" />
            {workflow.map((step) => (
              <article
                className="relative rounded-2xl border border-white/8 bg-[#0b0f18] p-6"
                key={step.number}
              >
                <span className="relative z-10 grid size-16 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/8 font-mono text-sm font-semibold text-blue-300">
                  {step.number}
                </span>
                <h3 className="mt-7 text-xl font-semibold tracking-[-0.03em]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative px-5 pb-22 sm:px-8 lg:pb-30"
        id="workspaces"
      >
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101725] to-[#0a0e16] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-7 sm:p-10 lg:p-14">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-blue-300">
              One login, every workspace
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Keep each workspace focused. Switch without friction.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">
              Manage multiple workspaces from one account. Every workspace keeps
              its own members, roles, dashboard, and operational context.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "Workspace-specific dashboards and teams",
                "Fast workspace switching",
                "Role-based member management",
              ].map((item) => (
                <div className="flex items-center gap-3 text-sm" key={item}>
                  <span className="grid size-6 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
                    <Check aria-hidden="true" size={13} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[390px] overflow-hidden border-t border-white/8 bg-[#070a10] p-6 lg:border-l lg:border-t-0 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(37,99,235,0.16),transparent_45%)]" />
            <div className="relative mx-auto max-w-lg space-y-3">
              <WorkspaceRow
                active
                members="26 members"
                name="Acme Corp"
                role="Admin"
              />
              <WorkspaceRow
                members="14 members"
                name="Northstar Labs"
                role="Member"
              />
              <WorkspaceRow
                members="8 members"
                name="Orbit Support"
                role="Guest"
              />
              <Link
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-4 text-sm text-slate-400"
                href="/register"
              >
                <Building2 aria-hidden="true" size={16} />
                Add another workspace
              </Link>
            </div>
            <div className="relative mx-auto mt-8 max-w-lg">
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
                Flexible workspace roles
              </p>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <span
                    className="rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-300"
                    key={role}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-5 pb-22 sm:px-8 lg:pb-30">
        <div className="marketing-cta mx-auto max-w-7xl overflow-hidden rounded-3xl border border-blue-300/15 px-6 py-14 text-center sm:px-12 sm:py-18">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 text-white">
            <Zap aria-hidden="true" size={22} />
          </div>
          <h2 className="mx-auto mt-6 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Give your team a clearer way to get work done.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-blue-100/70 sm:text-base">
            Create your TicketSense workspace and turn the next incoming issue
            into focused, measurable action.
          </p>
          <Link
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-blue-950 transition hover:bg-blue-50"
            href="/register"
          >
            Start building clarity
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Link className="flex items-center gap-2.5" href="/">
            <span className="grid size-8 place-items-center rounded-lg bg-blue-600">
              <TicketMark className="size-4" />
            </span>
            <span className="text-sm font-semibold">TicketSense</span>
          </Link>
          <p className="text-center text-xs text-slate-500">
            AI issue management for teams that value clarity.
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <Link className="transition hover:text-white" href="/login">
              Sign in
            </Link>
            <Link className="transition hover:text-white" href="/register">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProductPreview() {
  return (
    <div
      className="relative mx-auto mt-16 max-w-6xl sm:mt-20"
      id="product"
    >
      <div className="absolute inset-x-[10%] bottom-[-8%] h-[30%] rounded-full bg-blue-600/25 blur-[80px]" />
      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#0b0f17] shadow-[0_40px_100px_rgba(0,0,0,0.48)]">
        <div className="flex h-12 items-center gap-2 border-b border-white/8 px-4">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-300/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <span className="mx-auto hidden rounded-md border border-white/8 bg-white/3 px-16 py-1.5 font-mono text-[9px] text-slate-600 sm:block">
            app.ticketsense.io/dashboard
          </span>
        </div>

        <div className="grid min-h-[520px] sm:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden border-r border-white/8 bg-[#090c13] p-4 sm:block">
            <div className="flex items-center gap-2.5 px-2">
              <span className="grid size-8 place-items-center rounded-lg bg-blue-600">
                <TicketMark className="size-4" />
              </span>
              <strong className="text-xs">TicketSense</strong>
            </div>
            <div className="mt-7 space-y-1">
              {([
                [Gauge, "Dashboard", true],
                [TicketCheck, "Tickets", false],
                [Layers3, "Projects", false],
                [Bot, "AI Assistant", false],
                [Users, "Team", false],
              ] as const).map(([Icon, label, active]) => (
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] ${
                    active
                      ? "bg-blue-500/12 text-blue-200"
                      : "text-slate-500"
                  }`}
                  key={label}
                >
                  <Icon aria-hidden="true" size={14} />
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-white/8 pt-5">
              <span className="px-2 font-mono text-[8px] uppercase tracking-wider text-slate-600">
                Workspace
              </span>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 p-2.5">
                <span className="grid size-7 place-items-center rounded-md bg-blue-500/15 text-blue-300">
                  <Building2 size={13} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-[10px]">
                    Acme Corp
                  </strong>
                  <span className="block text-[8px] text-slate-600">
                    26 members
                  </span>
                </span>
                <ChevronDown
                  className="ml-auto text-slate-600"
                  size={12}
                />
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex h-14 items-center border-b border-white/8 px-4 sm:px-6">
              <div>
                <span className="block font-mono text-[8px] uppercase tracking-wider text-blue-300">
                  Friday, 24 October
                </span>
                <strong className="text-xs">Good morning, Alex</strong>
              </div>
              <span className="ml-auto flex items-center gap-2 rounded-full bg-emerald-400/8 px-2.5 py-1 text-[8px] text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Systems healthy
              </span>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <PreviewMetric
                  icon={TicketCheck}
                  label="Open tickets"
                  value="128"
                />
                <PreviewMetric
                  icon={Clock3}
                  label="SLA at risk"
                  tone="warning"
                  value="12"
                />
                <PreviewMetric
                  icon={CheckCircle2}
                  label="Resolved today"
                  tone="success"
                  value="47"
                />
                <PreviewMetric
                  icon={Sparkles}
                  label="AI assisted"
                  tone="tertiary"
                  value="68%"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
                <div className="rounded-xl border border-white/8 bg-[#0d121c]">
                  <div className="border-b border-white/8 px-4 py-3">
                    <strong className="text-[11px]">Needs attention</strong>
                    <span className="mt-0.5 block text-[8px] text-slate-600">
                      Ordered by operational impact
                    </span>
                  </div>
                  <div className="divide-y divide-white/6">
                    <PreviewTicket
                      id="TS-101"
                      priority="Critical"
                      status="In progress"
                      title="Authentication latency spike"
                    />
                    <PreviewTicket
                      id="TS-094"
                      priority="High"
                      status="Open"
                      title="Billing webhook retries"
                    />
                    <PreviewTicket
                      id="TS-088"
                      priority="High"
                      status="Review"
                      title="Customer export timing out"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-blue-400/18 bg-gradient-to-br from-blue-500/10 to-[#0d121c] p-4">
                  <div className="flex items-center justify-between">
                    <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white">
                      <Bot size={15} />
                    </span>
                    <span className="font-mono text-[8px] text-cyan-300">
                      LIVE
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">
                    AI operations brief
                  </h3>
                  <p className="mt-2 text-[10px] leading-5 text-slate-400">
                    Three priority tickets share the same authentication
                    dependency. Resolving TS-101 may unblock two incidents.
                  </p>
                  <div className="mt-4 space-y-2 border-t border-white/8 pt-3">
                    <PreviewInsight label="Duplicate cluster" value="3 tickets" />
                    <PreviewInsight label="Time saved" value="6.5 hours" />
                    <PreviewInsight label="Best owner" value="John Doe" />
                  </div>
                  <span className="mt-4 flex items-center gap-1 text-[9px] font-semibold text-blue-300">
                    Investigate with AI
                    <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({
  icon: Icon,
  label,
  tone = "primary",
  value,
}: {
  icon: typeof TicketCheck;
  label: string;
  tone?: "primary" | "warning" | "success" | "tertiary";
  value: string;
}) {
  const colors = {
    primary: "text-blue-300 bg-blue-400/8",
    warning: "text-amber-300 bg-amber-400/8",
    success: "text-emerald-300 bg-emerald-400/8",
    tertiary: "text-cyan-300 bg-cyan-400/8",
  };

  return (
    <article className="rounded-xl border border-white/8 bg-[#0d121c] p-3">
      <span className={`grid size-7 place-items-center rounded-lg ${colors[tone]}`}>
        <Icon aria-hidden="true" size={13} />
      </span>
      <strong className="mt-3 block text-lg tracking-[-0.03em]">
        {value}
      </strong>
      <span className="text-[8px] text-slate-600">{label}</span>
    </article>
  );
}

function PreviewTicket({
  id,
  priority,
  status,
  title,
}: {
  id: string;
  priority: string;
  status: string;
  title: string;
}) {
  return (
    <div className="grid grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3">
      <span className="font-mono text-[8px] font-semibold text-blue-300">
        {id}
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-[9px]">{title}</strong>
        <span className="text-[7px] text-slate-600">{status}</span>
      </span>
      <span
        className={`text-[7px] font-medium ${
          priority === "Critical" ? "text-red-300" : "text-amber-300"
        }`}
      >
        {priority}
      </span>
    </div>
  );
}

function PreviewInsight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[8px]">
      <span className="text-slate-600">{label}</span>
      <strong className="text-slate-300">{value}</strong>
    </div>
  );
}

function SectionHeading({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="max-w-2xl">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-blue-300">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">
        {children}
      </p>
    </div>
  );
}

function WorkspaceRow({
  active = false,
  members,
  name,
  role,
}: {
  active?: boolean;
  members: string;
  name: string;
  role: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 ${
        active
          ? "border-blue-400/25 bg-blue-500/10"
          : "border-white/8 bg-white/3"
      }`}
    >
      <span
        className={`grid size-10 place-items-center rounded-lg ${
          active
            ? "bg-blue-600 text-white"
            : "bg-white/5 text-slate-400"
        }`}
      >
        <Building2 aria-hidden="true" size={17} />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-sm">{name}</strong>
        <span className="block text-[10px] text-slate-500">{members}</span>
      </span>
      <span className="ml-auto rounded-full border border-white/10 px-2.5 py-1 text-[9px] text-slate-400">
        {role}
      </span>
      {active ? (
        <CheckCircle2
          aria-label="Current workspace"
          className="text-blue-300"
          size={16}
        />
      ) : null}
    </div>
  );
}
