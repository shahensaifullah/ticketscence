export type WorkspaceTicketStatus =
  | "Backlog"
  | "Open"
  | "In progress"
  | "In review"
  | "Resolved"
  | "Closed";

export type WorkspacePriority = "Critical" | "High" | "Medium" | "Low";

export type WorkspaceTicket = {
  id: string;
  title: string;
  status: WorkspaceTicketStatus;
  priority: WorkspacePriority;
  project: string;
  projectKey: string;
  category: string;
  assignee: string;
  assigneeInitials: string;
  due: string;
  labels: string[];
  comments: number;
  attachments: number;
  duplicateRisk?: number;
};

export const workspaceTickets: WorkspaceTicket[] = [
  {
    id: "TS-101",
    title: "Database migration latency in production",
    status: "Open",
    priority: "Critical",
    project: "Core Platform",
    projectKey: "CORE",
    category: "Performance",
    assignee: "John Doe",
    assigneeInitials: "JD",
    due: "Today",
    labels: ["database", "production"],
    comments: 8,
    attachments: 3,
    duplicateRisk: 82,
  },
  {
    id: "TS-102",
    title: "Update security headers for OAuth endpoints",
    status: "In progress",
    priority: "Medium",
    project: "Core Platform",
    projectKey: "CORE",
    category: "Security",
    assignee: "Jane Smith",
    assigneeInitials: "JS",
    due: "Tomorrow",
    labels: ["oauth", "security"],
    comments: 4,
    attachments: 1,
  },
  {
    id: "TS-103",
    title: "AI categorization fails on multilingual input",
    status: "In review",
    priority: "High",
    project: "AI Operations",
    projectKey: "AIOPS",
    category: "AI quality",
    assignee: "Elena Rodriguez",
    assigneeInitials: "ER",
    due: "Oct 28",
    labels: ["ai", "i18n"],
    comments: 11,
    attachments: 2,
    duplicateRisk: 44,
  },
  {
    id: "TS-104",
    title: "Refactor reporting utility functions",
    status: "Backlog",
    priority: "Low",
    project: "Analytics",
    projectKey: "DATA",
    category: "Maintenance",
    assignee: "Unassigned",
    assigneeInitials: "—",
    due: "Not set",
    labels: ["reporting"],
    comments: 1,
    attachments: 0,
  },
  {
    id: "TS-105",
    title: "Customer export returns incomplete CSV rows",
    status: "Open",
    priority: "High",
    project: "Customer Experience",
    projectKey: "CX",
    category: "Data integrity",
    assignee: "Marcus Chen",
    assigneeInitials: "MC",
    due: "Oct 26",
    labels: ["exports", "customer"],
    comments: 6,
    attachments: 2,
    duplicateRisk: 67,
  },
  {
    id: "TS-106",
    title: "Add audit trail to permission changes",
    status: "In progress",
    priority: "Medium",
    project: "Core Platform",
    projectKey: "CORE",
    category: "Compliance",
    assignee: "Sarah Jenkins",
    assigneeInitials: "SJ",
    due: "Oct 30",
    labels: ["audit", "permissions"],
    comments: 3,
    attachments: 0,
  },
  {
    id: "TS-107",
    title: "Resolve mobile ticket table overflow",
    status: "Resolved",
    priority: "Medium",
    project: "Customer Experience",
    projectKey: "CX",
    category: "Frontend",
    assignee: "Jane Smith",
    assigneeInitials: "JS",
    due: "Completed",
    labels: ["mobile", "ui"],
    comments: 5,
    attachments: 1,
  },
  {
    id: "TS-108",
    title: "Retire legacy webhook signing secret",
    status: "Closed",
    priority: "Low",
    project: "Core Platform",
    projectKey: "CORE",
    category: "Security",
    assignee: "John Doe",
    assigneeInitials: "JD",
    due: "Completed",
    labels: ["webhooks"],
    comments: 2,
    attachments: 0,
  },
];

export const projects = [
  {
    key: "CORE",
    name: "Core Platform",
    description: "Authentication, APIs, data services, and shared infrastructure.",
    color: "#2563eb",
    lead: "John Doe",
    members: 8,
    open: 24,
    health: 78,
  },
  {
    key: "AIOPS",
    name: "AI Operations",
    description: "Ticket intelligence, recommendations, and automation quality.",
    color: "#7c3aed",
    lead: "Elena Rodriguez",
    members: 6,
    open: 13,
    health: 86,
  },
  {
    key: "CX",
    name: "Customer Experience",
    description: "Support portal, notifications, and customer-facing workflows.",
    color: "#0891b2",
    lead: "Jane Smith",
    members: 7,
    open: 18,
    health: 91,
  },
  {
    key: "DATA",
    name: "Analytics",
    description: "Reporting, exports, operational metrics, and data governance.",
    color: "#059669",
    lead: "Marcus Chen",
    members: 5,
    open: 9,
    health: 83,
  },
];

export const teamMembers = [
  { name: "John Doe", initials: "JD", role: "Engineering lead", assigned: 12, capacity: 80, resolved: 38, status: "Available" },
  { name: "Elena Rodriguez", initials: "ER", role: "AI engineer", assigned: 9, capacity: 64, resolved: 31, status: "Available" },
  { name: "Jane Smith", initials: "JS", role: "Frontend engineer", assigned: 11, capacity: 76, resolved: 42, status: "Focus time" },
  { name: "Marcus Chen", initials: "MC", role: "Data engineer", assigned: 7, capacity: 52, resolved: 29, status: "Available" },
  { name: "Sarah Jenkins", initials: "SJ", role: "Support lead", assigned: 14, capacity: 92, resolved: 51, status: "At capacity" },
];

export const notifications = [
  { id: 1, type: "assignment", title: "TS-101 was assigned to you", detail: "Critical database latency in Core Platform", time: "2 min ago", unread: true },
  { id: 2, type: "mention", title: "Elena mentioned you", detail: "“Can you confirm the worker pool configuration?”", time: "18 min ago", unread: true },
  { id: 3, type: "sla", title: "SLA deadline approaching", detail: "TS-105 is due in 3 hours", time: "42 min ago", unread: true },
  { id: 4, type: "ai", title: "AI solution ready", detail: "A verified solution was found for TS-103", time: "1 hr ago", unread: true },
  { id: 5, type: "status", title: "TS-107 was resolved", detail: "Jane Smith moved the ticket to Resolved", time: "Yesterday", unread: false },
  { id: 6, type: "project", title: "You joined AI Operations", detail: "Elena added you as a project member", time: "2 days ago", unread: false },
];

export const dashboardMetrics = [
  { label: "Total tickets", value: "1,284", change: "+12%", tone: "primary" },
  { label: "Open", value: "42", change: "+5", tone: "error" },
  { label: "In progress", value: "18", change: "-2", tone: "tertiary" },
  { label: "Resolved", value: "1,224", change: "+84", tone: "success" },
  { label: "Assigned to me", value: "12", change: "3 due", tone: "primary" },
  { label: "Overdue", value: "7", change: "-3", tone: "warning" },
  { label: "SLA compliance", value: "94.6%", change: "+2.1%", tone: "success" },
  { label: "AI-assisted", value: "38%", change: "+7%", tone: "tertiary" },
];
