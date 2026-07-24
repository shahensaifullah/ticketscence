import { AppShell } from "./app-shell/app-shell";

type ProductShellProps = {
  children: React.ReactNode;
  activeSide?: "inbox" | "issues" | "views" | "projects" | "assistant";
  activeTop?: "dashboard" | "tickets" | "reports";
};

/**
 * Compatibility wrapper for the current TicketSense pages.
 * Route-aware navigation is now handled by AppShell.
 */
export function ProductShell({ children }: ProductShellProps) {
  return <AppShell>{children}</AppShell>;
}
