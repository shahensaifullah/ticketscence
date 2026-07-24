"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut, Plus, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { TicketMark } from "../icons";
import {
  primaryNavigation,
  secondaryNavigation,
  type NavigationItem,
} from "./navigation";

type AppSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
};

export function AppSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          type="button"
        />
      )}

      <aside
        aria-label="Application navigation"
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-[var(--outline-variant)] bg-[var(--surface-container-low)] transition-[width,transform] duration-200 md:relative md:z-20 ${
          collapsed ? "md:w-20" : "md:w-[280px]"
        } ${mobileOpen ? "w-[280px] translate-x-0" : "w-[280px] -translate-x-full md:translate-x-0"}`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-[var(--outline-variant)] px-4">
          <Link
            aria-label="TicketSense dashboard"
            className={`flex min-w-0 items-center gap-3 ${collapsed ? "md:justify-center" : ""}`}
            href="/dashboard"
            onClick={onCloseMobile}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-sm">
              <TicketMark className="size-5" />
            </span>
            <span className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <strong className="block truncate text-base leading-5 text-[var(--on-surface)]">
                TicketSense
              </strong>
              <span className="block truncate font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--outline)]">
                AI issue management
              </span>
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            className="ml-auto grid size-9 place-items-center rounded-lg text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] md:hidden"
            onClick={onCloseMobile}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="border-b border-[var(--outline-variant)] p-3">
          <Link
            className={`flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary-container)] px-3 text-sm font-semibold text-[var(--on-primary-container)] shadow-sm transition hover:brightness-110 active:scale-[0.98] ${
              collapsed ? "md:px-0" : ""
            }`}
            href="/tickets/new"
            onClick={onCloseMobile}
          >
            <Plus aria-hidden="true" size={18} />
            <span className={collapsed ? "md:hidden" : ""}>Create ticket</span>
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
          <div className="space-y-1">
            {primaryNavigation.map((item) => (
              <NavigationLink
                collapsed={collapsed}
                currentPath={pathname}
                item={item}
                key={item.label}
                onNavigate={onCloseMobile}
              />
            ))}
          </div>

          <div className="mt-auto space-y-1 border-t border-[var(--outline-variant)] pt-3">
            {secondaryNavigation.map((item) => (
              <NavigationLink
                collapsed={collapsed}
                currentPath={pathname}
                item={item}
                key={item.label}
                onNavigate={onCloseMobile}
              />
            ))}
            <Link
              className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-[var(--on-surface-variant)] transition hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]"
              href="/login"
              onClick={onCloseMobile}
              title={collapsed ? "Log out" : undefined}
            >
              <LogOut aria-hidden="true" className="shrink-0" size={18} />
              <span className={collapsed ? "md:hidden" : ""}>Log out</span>
            </Link>
          </div>
        </nav>

        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-[76px] hidden size-7 place-items-center rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container)] text-[var(--on-surface-variant)] shadow-md transition hover:text-[var(--on-surface)] md:grid"
          onClick={onToggleCollapsed}
          type="button"
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" size={14} />
          ) : (
            <ChevronLeft aria-hidden="true" size={14} />
          )}
        </button>
      </aside>
    </>
  );
}

function NavigationLink({
  collapsed,
  currentPath,
  item,
  onNavigate,
}: {
  collapsed: boolean;
  currentPath: string;
  item: NavigationItem;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const matchPaths = item.match ?? [item.href.split("?")[0]];
  const active = matchPaths.some(
    (path) => currentPath === path || (path !== "/dashboard" && currentPath.startsWith(`${path}/`)),
  );

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`group flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition ${
        active
          ? "bg-[var(--secondary-container)] font-semibold text-[var(--on-secondary-container)]"
          : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]"
      }`}
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
    >
      <Icon aria-hidden="true" className="shrink-0" size={18} />
      <span className={`min-w-0 flex-1 truncate ${collapsed ? "md:hidden" : ""}`}>
        {item.label}
      </span>
      {item.badge && (
        <span
          className={`grid min-w-5 place-items-center rounded-full bg-[var(--primary-container)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--on-primary-container)] ${
            collapsed ? "md:hidden" : ""
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
