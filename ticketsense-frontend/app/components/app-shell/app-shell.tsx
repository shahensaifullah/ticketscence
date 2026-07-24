"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[var(--surface)] text-[var(--on-surface)]">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onOpenMobile={() => setMobileOpen(true)} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
