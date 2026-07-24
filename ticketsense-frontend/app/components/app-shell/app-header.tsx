"use client";

import Link from "next/link";
import {
  Bell,
  Building2,
  ChevronDown,
  Command,
  FolderKanban,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Breadcrumbs } from "./breadcrumbs";

type Theme = "dark" | "light";

type AppHeaderProps = {
  onOpenMobile: () => void;
};

export function AppHeader({ onOpenMobile }: AppHeaderProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem("ticketsense.theme");
      const preferredTheme =
        savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark";
      setTheme(preferredTheme);
      document.documentElement.dataset.theme = preferredTheme;
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("ticketsense.theme", nextTheme);
  }

  return (
    <header
      className="relative z-30 shrink-0 border-b border-[var(--outline-variant)] bg-[var(--surface)]"
      ref={headerRef}
    >
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <button
          aria-label="Open navigation"
          className="grid size-10 shrink-0 place-items-center rounded-lg text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] md:hidden"
          onClick={onOpenMobile}
          type="button"
        >
          <Menu aria-hidden="true" size={20} />
        </button>

        <div className="hidden min-w-0 items-center gap-2 xl:flex">
          <Selector
            icon={Building2}
            label="Organization"
            options={["Acme Corp", "Northstar Labs"]}
            value="Acme Corp"
          />
          <Selector
            icon={FolderKanban}
            label="Project"
            options={["All projects", "Core Platform", "AI Operations", "Customer Experience"]}
            value="All projects"
          />
        </div>

        <button
          aria-expanded={searchOpen}
          aria-label="Open global search"
          className="mx-auto flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-left text-sm text-[var(--outline)] transition hover:border-[var(--outline)] sm:max-w-md"
          onClick={() => setSearchOpen(true)}
          type="button"
        >
          <Search aria-hidden="true" className="shrink-0" size={17} />
          <span className="truncate">Search tickets, projects, or people…</span>
          <span className="ml-auto hidden items-center gap-1 rounded border border-[var(--outline-variant)] px-1.5 py-0.5 font-mono text-[9px] sm:flex">
            <Command aria-hidden="true" size={10} /> K
          </span>
        </button>

        <Link
          className="hidden h-10 items-center gap-2 rounded-lg bg-[var(--primary-container)] px-4 text-sm font-semibold text-[var(--on-primary-container)] transition hover:brightness-110 lg:flex"
          href="/tickets/new"
        >
          <Plus aria-hidden="true" size={17} />
          Create ticket
        </Link>

        <button
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-pressed={theme === "light"}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-[var(--on-surface-variant)] transition hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]"
          onClick={toggleTheme}
          type="button"
        >
          {theme === "dark" ? (
            <Sun aria-hidden="true" size={18} />
          ) : (
            <Moon aria-hidden="true" size={18} />
          )}
        </button>

        <div className="relative">
          <button
            aria-expanded={notificationsOpen}
            aria-label="Notifications, 4 unread"
            className="relative grid size-10 shrink-0 place-items-center rounded-lg text-[var(--on-surface-variant)] transition hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
            type="button"
          >
            <Bell aria-hidden="true" size={18} />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--error)] ring-2 ring-[var(--surface)]" />
          </button>
          {notificationsOpen && <NotificationMenu />}
        </div>

        <div className="relative">
          <button
            aria-expanded={profileOpen}
            aria-label="Open user menu"
            className="flex h-10 items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-[var(--surface-container-high)]"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            type="button"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[var(--secondary-container)] text-[10px] font-bold text-[var(--on-secondary-container)]">
              AM
            </span>
            <span className="hidden min-w-0 lg:block">
              <strong className="block max-w-28 truncate text-xs text-[var(--on-surface)]">
                Alex Morgan
              </strong>
              <span className="block text-[10px] text-[var(--outline)]">Administrator</span>
            </span>
            <ChevronDown aria-hidden="true" className="hidden text-[var(--outline)] lg:block" size={14} />
          </button>
          {profileOpen && <ProfileMenu />}
        </div>
      </div>

      <div className="flex h-11 items-center justify-between gap-3 border-t border-[var(--outline-variant)]/70 px-4 sm:px-5">
        <Breadcrumbs />
        <div className="hidden items-center gap-2 text-[10px] text-[var(--outline)] sm:flex">
          <span className="size-1.5 rounded-full bg-[var(--success)]" />
          All systems operational
        </div>
      </div>

      {searchOpen && (
        <div className="absolute inset-x-3 top-3 z-40 sm:left-1/2 sm:right-auto sm:w-[min(620px,calc(100vw-32px))] sm:-translate-x-1/2">
          <div className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container)] p-2 shadow-2xl">
            <div className="flex items-center gap-3 px-3">
              <Search aria-hidden="true" className="text-[var(--outline)]" size={18} />
              <label className="sr-only" htmlFor="global-search">Global search</label>
              <input
                autoFocus
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--on-surface)] outline-none placeholder:text-[var(--outline)]"
                id="global-search"
                placeholder="Search tickets, projects, or people…"
                type="search"
              />
              <button
                aria-label="Close search"
                className="grid size-8 place-items-center rounded-md text-[var(--outline)] hover:bg-[var(--surface-container-high)]"
                onClick={() => setSearchOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>
            <div className="border-t border-[var(--outline-variant)] px-3 py-3 text-xs text-[var(--outline)]">
              Start typing to search across your workspace.
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Selector({
  icon: Icon,
  label,
  options,
  value,
}: {
  icon: typeof Building2;
  label: string;
  options: string[];
  value: string;
}) {
  return (
    <label
      className="flex h-10 min-w-0 items-center gap-2 rounded-lg px-2 text-left transition hover:bg-[var(--surface-container-high)]"
    >
      <Icon aria-hidden="true" className="shrink-0 text-[var(--outline)]" size={16} />
      <span className="min-w-0">
        <span className="block font-mono text-[8px] uppercase tracking-wider text-[var(--outline)]">{label}</span>
        <select
          aria-label={label}
          className="block max-w-28 cursor-pointer appearance-none truncate bg-transparent pr-4 text-xs font-medium text-[var(--on-surface)] outline-none"
          defaultValue={value}
        >
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      </span>
      <ChevronDown aria-hidden="true" className="-ml-5 shrink-0 text-[var(--outline)]" size={13} />
    </label>
  );
}

function NotificationMenu() {
  return (
    <section className="absolute right-0 top-12 w-[min(360px,calc(100vw-24px))] rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container)] p-2 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--on-surface)]">Notifications</h2>
          <p className="text-[10px] text-[var(--outline)]">You have 4 unread updates</p>
        </div>
        <button className="text-[10px] font-semibold text-[var(--primary)] hover:underline" type="button">
          Mark all read
        </button>
      </div>
      <div className="space-y-1 border-y border-[var(--outline-variant)] py-2">
        <NotificationItem
          description="TS-101 was assigned to you"
          time="2 min"
          title="New ticket assignment"
        />
        <NotificationItem
          description="The SLA expires in 4 hours"
          time="18 min"
          title="Critical ticket warning"
        />
        <NotificationItem
          description="A verified fix is ready for review"
          time="1 hr"
          title="AI solution available"
        />
      </div>
      <Link className="block px-3 py-2.5 text-center text-xs font-semibold text-[var(--primary)] hover:underline" href="/notifications">
        View all notifications
      </Link>
    </section>
  );
}

function NotificationItem({
  description,
  time,
  title,
}: {
  description: string;
  time: string;
  title: string;
}) {
  return (
    <button className="flex w-full gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--surface-container-high)]" type="button">
      <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--primary-container)]" />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-xs text-[var(--on-surface)]">{title}</strong>
        <span className="mt-0.5 block truncate text-[10px] text-[var(--outline)]">{description}</span>
      </span>
      <span className="shrink-0 font-mono text-[9px] text-[var(--outline)]">{time}</span>
    </button>
  );
}

function ProfileMenu() {
  return (
    <div className="absolute right-0 top-12 w-56 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container)] p-2 shadow-2xl">
      <div className="border-b border-[var(--outline-variant)] px-3 py-2">
        <strong className="block text-xs text-[var(--on-surface)]">alex@acme.com</strong>
        <span className="text-[10px] text-[var(--outline)]">Acme Corp workspace</span>
      </div>
      <MenuLink href="/settings" icon={User} label="Your profile" />
      <MenuLink href="/settings" icon={Settings} label="Settings" />
      <div className="my-1 border-t border-[var(--outline-variant)]" />
      <MenuLink href="/login" icon={LogOut} label="Log out" />
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof User;
  label: string;
}) {
  return (
    <Link className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]" href={href}>
      <Icon aria-hidden="true" size={15} />
      {label}
    </Link>
  );
}
