"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "my-work": "My Work",
  topics: "Topics",
  tickets: "Tickets",
  new: "Create issue",
  board: "Tickets",
  projects: "Projects",
  assistant: "AI Assistant",
  analytics: "Analytics",
  team: "Team",
  notifications: "Notifications",
  settings: "Settings",
  data: "Settings",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (pathname === "/dashboard") {
    return <span className="text-sm font-medium text-[var(--on-surface)]">Dashboard</span>;
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--outline)]">
        <li>
          <Link
            aria-label="Dashboard"
            className="grid size-7 place-items-center rounded-md transition hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]"
            href="/dashboard"
          >
            <Home aria-hidden="true" size={14} />
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isCurrent = index === segments.length - 1;
          const label =
            segmentLabels[segment] ??
            decodeURIComponent(segment).replaceAll("-", " ").toUpperCase();

          return (
            <li className="flex min-w-0 items-center gap-1.5" key={href}>
              <ChevronRight aria-hidden="true" className="shrink-0" size={13} />
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="truncate font-medium text-[var(--on-surface)]"
                >
                  {label}
                </span>
              ) : (
                <Link
                  className="truncate transition hover:text-[var(--on-surface)]"
                  href={href}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
