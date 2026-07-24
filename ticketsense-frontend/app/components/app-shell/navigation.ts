import {
  BarChart3,
  Bell,
  Bot,
  Columns3,
  FolderKanban,
  Gauge,
  ListChecks,
  Settings,
  TicketCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match?: string[];
  badge?: string;
};

export const primaryNavigation: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "My Work", href: "/my-work", icon: ListChecks },
  {
    label: "Tickets",
    href: "/tickets",
    icon: TicketCheck,
    match: ["/tickets", "/tickets/new"],
  },
  { label: "Board", href: "/board", icon: Columns3 },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "AI Assistant", href: "/assistant", icon: Bot },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Team", href: "/team", icon: Users },
];

export const secondaryNavigation: NavigationItem[] = [
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    badge: "4",
  },
  { label: "Settings", href: "/settings", icon: Settings },
];
