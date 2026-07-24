import Link from "next/link";
import type { ReactNode } from "react";
import { TicketMark } from "./icons";

type AuthShellProps = {
  children: ReactNode;
  mode: "login" | "register";
};

export function AuthShell({ children, mode }: AuthShellProps) {
  const isLogin = mode === "login";

  return (
    <main className="page-shell auth-page">
      <section className="auth-card" aria-label={isLogin ? "Sign in" : "Create account"}>
        <aside className="auth-brand-panel">
          <Link className="brand" href="/" aria-label="TicketSense home">
            <span className="brand-mark">
              <TicketMark width="24" height="24" />
            </span>
            <span className="brand-name">TicketSense</span>
          </Link>

          <div className="brand-copy">
            <p className="brand-eyebrow">AI-powered support operations</p>
            <h2>
              {isLogin
                ? "Turn every ticket into a clear next step."
                : "Build a calmer, faster support operation."}
            </h2>
            <p>
              TicketSense brings signals, priorities, and team context together so
              you can resolve the work that matters most.
            </p>
          </div>

          <div className="signal-card" aria-label="TicketSense system status">
            <div className="signal-row">
              <span className="signal-status">
                <span className="signal-dot" />
                Intelligence engine online
              </span>
              <span>72% analyzed</span>
            </div>
            <div className="signal-track" />
          </div>
        </aside>

        <div className="auth-form-panel">
          <div className="auth-form-wrap">
            <Link className="brand mobile-brand" href="/" aria-label="TicketSense home">
              <span className="brand-mark">
                <TicketMark width="22" height="22" />
              </span>
              <span className="brand-name">TicketSense</span>
            </Link>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
