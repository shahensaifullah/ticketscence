export type Ticket = {
  id: string;
  title: string;
  description: string;
  project: string;
  type: "Bug" | "Task" | "Feature" | "Incident";
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Review" | "Backlog" | "Resolved" | "Closed";
  assignee: string;
  initials: string;
  created: string;
  dueDate?: string;
  labels: string[];
  originTopic?: {
    uid: string;
    title: string;
    topicType: string;
    status: string;
  };
  externalLinks?: Array<{
    uid: string;
    provider: string;
    url: string;
    label: string;
  }>;
};

export const TICKET_STORAGE_KEY = "ticketsense.custom-tickets";

export const seedTickets: Ticket[] = [
  {
    id: "TS-101",
    title: "Database migration latency issues in production-01",
    description:
      "Production database migrations are exceeding the expected execution window and causing elevated API response times. Investigate locks, query plans, and migration batching before the next release.",
    project: "Backend Support",
    type: "Incident",
    priority: "Critical",
    status: "Open",
    assignee: "John Doe",
    initials: "JD",
    created: "Oct 24, 2023",
    dueDate: "Today, 5:00 PM",
    labels: ["database", "production", "latency"],
  },
  {
    id: "TS-102",
    title: "Update security headers for OAuth2 endpoints",
    description:
      "Review and update security headers across the OAuth2 authorization, token, and callback endpoints.",
    project: "Platform",
    type: "Task",
    priority: "Medium",
    status: "In Progress",
    assignee: "Jane Smith",
    initials: "JS",
    created: "Oct 23, 2023",
    dueDate: "Oct 27, 2023",
    labels: ["security", "oauth"],
  },
  {
    id: "TS-103",
    title: "AI categorization failing on multi-language inputs",
    description:
      "The automatic ticket classifier assigns incorrect categories when a request contains more than one language.",
    project: "AI Operations",
    type: "Bug",
    priority: "High",
    status: "Review",
    assignee: "Ticket Bot",
    initials: "AI",
    created: "Oct 22, 2023",
    dueDate: "Oct 28, 2023",
    labels: ["ai", "classification", "i18n"],
  },
  {
    id: "TS-104",
    title: "Refactor utility functions in reporting module",
    description:
      "Consolidate duplicated report formatting helpers and improve their automated test coverage.",
    project: "Analytics",
    type: "Task",
    priority: "Low",
    status: "Backlog",
    assignee: "Unassigned",
    initials: "—",
    created: "Oct 21, 2023",
    labels: ["reporting", "maintenance"],
  },
];

export function readCustomTickets(): Ticket[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(TICKET_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Ticket[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomTicket(ticket: Ticket) {
  const existing = readCustomTickets();
  window.localStorage.setItem(
    TICKET_STORAGE_KEY,
    JSON.stringify([ticket, ...existing.filter((item) => item.id !== ticket.id)]),
  );
}
