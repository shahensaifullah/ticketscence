import type { Metadata } from "next";
import Link from "next/link";
import { ProductShell } from "../../components/product-shell";

export const metadata: Metadata = {
  title: "PROJECT-842",
  description: "Critical latency spike ticket details and AI resolution guidance.",
};

export default function TicketDetailsPage() {
  return (
    <ProductShell activeSide="projects" activeTop="tickets">
      <div className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Link className="font-mono text-xs font-semibold text-[var(--primary)] hover:underline" href="/tickets">
                  PROJECT-842
                </Link>
                <span className="text-[var(--outline-variant)]">•</span>
                <span className="font-mono text-[10px] text-[var(--outline)]">Created 2 hours ago</span>
              </div>
              <h1 className="max-w-3xl text-2xl font-semibold leading-8 tracking-[-0.01em]">
                Critical latency spikes in auth-service middleware during peak load
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="border-[var(--error)]/30 bg-[var(--error-container)]/20 text-[var(--error)]">!! CRITICAL</Badge>
                <Badge className="border-[var(--primary)]/30 bg-[var(--primary-container)]/20 text-[var(--primary)]">IN PROGRESS</Badge>
                <Badge className="border-[var(--outline)]/30 bg-[var(--surface-container-highest)]/30 text-[var(--on-surface-variant)]">BUG</Badge>
              </div>
            </div>

            <section className="mb-6 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-lg font-semibold">
                  <span className="text-[var(--primary)]">▤</span>
                  Description
                </h2>
                <button className="font-mono text-[10px] font-semibold text-[var(--primary)] hover:underline" type="button">
                  EDIT
                </button>
              </div>
              <div className="space-y-4 text-sm leading-6 text-[var(--on-surface-variant)]">
                <p>
                  Observed significant response time degradation (&gt;1500ms) in the
                  authentication middleware when request volume exceeds 5k RPS.
                  Preliminary logs suggest a bottleneck in the JWT validation loop.
                </p>
                <div>
                  <h3 className="mb-2 font-semibold text-[var(--on-surface)]">Steps to Reproduce:</h3>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>Initiate a load test with 6k concurrent connections.</li>
                    <li>Monitor the <code className="text-[var(--primary)]">/api/v1/auth/verify</code> endpoint.</li>
                    <li>Observe the p99 latency climbing from 20ms to 1800ms.</li>
                  </ol>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-[var(--on-surface)]">Log Trace:</h3>
                  <pre className="overflow-x-auto rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-4 font-mono text-[11px] leading-5 text-[var(--secondary)]">
{`[ERROR] 2024-05-24 14:02:11 - auth-service - Context deadline exceeded
[WARN]  2024-05-24 14:02:15 - auth-service - Cache hit rate dropped below 40%
[DEBUG] 2024-05-24 14:02:20 - Connection pool exhaustion detected (Max: 50)`}
                  </pre>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 flex items-center gap-3 text-lg font-semibold">
                <span className="text-[var(--primary)]">⌕</span>
                Attachments (2)
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Attachment name="latency_graph_may24.png" size="1.2 MB • PNG" icon="▧" />
                <Attachment name="server_logs_dump.txt" size="450 KB • TXT" icon="▤" />
              </div>
            </section>

            <section>
              <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold">
                <span className="text-[var(--primary)]">◌</span>
                Activity
              </h2>
              <div className="relative space-y-5 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-[var(--outline-variant)]">
                <Comment
                  initials="MC"
                  name="Marcus Chen"
                  time="1 hour ago"
                  text="I've increased the connection pool size to 100 as a temporary fix, but we need to address the root cause in the middleware."
                />
                <Comment
                  initials="ER"
                  name="Elena Rodriguez"
                  time="15 minutes ago"
                  text="Checking the JWT decoding library now. We might be using a blocking synchronous call in the hot path."
                />
              </div>
              <form className="mt-6 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-high)] p-4">
                <label className="sr-only" htmlFor="comment">Add a comment</label>
                <textarea
                  className="min-h-24 w-full resize-y bg-transparent text-sm text-[var(--on-surface)] outline-none placeholder:text-[var(--outline)]"
                  id="comment"
                  placeholder="Write a comment..."
                />
                <div className="flex items-center justify-between border-t border-[var(--outline-variant)] pt-3">
                  <div className="flex gap-1">
                    {["B", "I", "</>", "⌕"].map((tool) => (
                      <button
                        aria-label={`Formatting ${tool}`}
                        className="rounded px-2 py-1 text-xs text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-highest)]"
                        key={tool}
                        type="button"
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                  <button className="rounded-lg bg-[var(--primary-container)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]" type="submit">
                    Send
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>

        <aside className="border-t border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 xl:overflow-y-auto xl:border-l xl:border-t-0">
          <article className="ai-panel mb-6 rounded-xl p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-[var(--primary-container)] text-white">✦</span>
              <h2 className="text-xl font-bold">AI Suggestion</h2>
            </div>
            <p className="mb-4 text-sm leading-6 text-[var(--on-surface-variant)]">
              Based on PROJECT-731, this latency spike is likely caused by the{" "}
              <strong className="text-[var(--on-surface)]">RS256</strong> signature verification
              failing to leverage worker threads.
            </p>
            <button className="w-full rounded-lg bg-[var(--primary-container)] px-4 py-3 text-sm font-bold text-[var(--on-primary-container)] transition hover:bg-[var(--primary-hover)]" type="button">
              Apply Fix Path ↗
            </button>
          </article>

          <SidebarSection title="DETAILS">
            <Detail label="ASSIGNEE">
              <span className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-[var(--primary-container)] text-[9px] text-white">ER</span>
                Elena Rodriguez
              </span>
            </Detail>
            <Detail label="REPORTER">
              <span className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-[var(--surface-container-highest)] text-[9px]">SM</span>
                SRE Monitoring Bot
              </span>
            </Detail>
            <Detail label="DUE DATE"><span className="text-[var(--error)]">◷ Today, 5:00 PM</span></Detail>
            <Detail label="LABELS">
              <span className="flex flex-wrap gap-2">
                {["back-end", "performance", "auth"].map((label) => (
                  <span className="rounded bg-[var(--surface-container-highest)] px-2 py-1 text-[11px]" key={label}>{label}</span>
                ))}
              </span>
            </Detail>
          </SidebarSection>

          <SidebarSection title="SIMILAR TICKETS">
            <Link className="block rounded-lg p-3 hover:bg-[var(--surface-container-high)]" href="#">
              <span className="font-mono text-[10px] text-[var(--primary)]">PROJECT-731</span>
              <span className="mt-1 block text-sm">JWT verification bottleneck in dev</span>
            </Link>
            <Link className="block rounded-lg p-3 hover:bg-[var(--surface-container-high)]" href="#">
              <span className="font-mono text-[10px] text-[var(--primary)]">PROJECT-650</span>
              <span className="mt-1 block text-sm">Worker pool exhaustion in auth</span>
            </Link>
          </SidebarSection>

          <SidebarSection title="WATCHERS (4)">
            <div className="flex items-center -space-x-2">
              {["MC", "ER", "JS", "+1"].map((initials) => (
                <span className="grid size-8 place-items-center rounded-full border-2 border-[var(--surface-container-low)] bg-[var(--surface-container-highest)] text-[9px]" key={initials}>
                  {initials}
                </span>
              ))}
              <button aria-label="Add watcher" className="ml-4 grid size-8 place-items-center rounded-full border border-[var(--outline-variant)] text-[var(--primary)]" type="button">＋</button>
            </div>
          </SidebarSection>
        </aside>
      </div>
    </ProductShell>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold ${className}`}>{children}</span>;
}

function Attachment({ icon, name, size }: { icon: string; name: string; size: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container)] p-3">
      <span className="grid size-10 place-items-center rounded bg-[var(--surface-container-highest)] text-[var(--primary)]">{icon}</span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm">{name}</strong>
        <span className="text-[11px] text-[var(--outline)]">{size}</span>
      </span>
      <button aria-label={`Download ${name}`} className="text-[var(--primary)]" type="button">↓</button>
    </div>
  );
}

function Comment({ initials, name, text, time }: { initials: string; name: string; text: string; time: string }) {
  return (
    <div className="relative flex gap-4">
      <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border border-[var(--outline-variant)] bg-[var(--surface)] text-[9px] text-[var(--primary)]">{initials}</span>
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          <strong className="text-sm">{name}</strong>
          <span className="font-mono text-[10px] text-[var(--outline)]">{time}</span>
        </div>
        <p className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container)] p-4 text-sm leading-6 text-[var(--on-surface-variant)]">{text}</p>
      </div>
    </div>
  );
}

function SidebarSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="mb-6 border-b border-[var(--outline-variant)] pb-6 last:border-0">
      <h3 className="mb-3 font-mono text-[10px] tracking-wider text-[var(--outline)]">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Detail({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-3 py-2 text-sm">
      <span className="font-mono text-[9px] text-[var(--outline)]">{label}</span>
      <span className="text-[var(--on-surface-variant)]">{children}</span>
    </div>
  );
}
