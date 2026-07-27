import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const clientConfig = {
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
};

const authApi = axios.create(clientConfig);
export const api = axios.create(clientConfig);

let accessToken: string | null = null;
let refreshRequest: Promise<string> | null = null;

type RetriableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type AuthResponse = {
  access: string;
};

function setAccessToken(token: string | null) {
  accessToken = token;
}

function isAuthRequest(url?: string) {
  return (
    url?.includes("/api/auth/login") ||
    url?.includes("/api/auth/refresh") ||
    url?.includes("/api/auth/logout")
  );
}

function redirectToLogin() {
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/login"
  ) {
    window.location.replace("/login");
  }
}

async function requestNewAccessToken() {
  const response = await authApi.post<AuthResponse>("/api/auth/refresh");
  setAccessToken(response.data.access);
  return response.data.access;
}

export async function refreshSession() {
  if (!refreshRequest) {
    refreshRequest = requestNewAccessToken()
      .catch((error) => {
        setAccessToken(null);
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

export function ensureSession() {
  return accessToken ? Promise.resolve(accessToken) : refreshSession();
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequest | undefined;

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      isAuthRequest(request.url)
    ) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      const token = await refreshSession();
      request.headers.set("Authorization", `Bearer ${token}`);
      return api(request);
    } catch (refreshError) {
      setAccessToken(null);
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  workspace_name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
};

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "member"
  | "guest";

export type WorkspaceUser = {
  uid: string;
  name: string;
  email: string;
  workspace_count: number;
};

export type WorkspaceSummary = {
  uid: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  role_label: string;
  is_current: boolean;
  member_count: number;
};

export type WorkspaceMember = {
  uid: string;
  user_uid: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  role_label: string;
};

export type ProjectStatus =
  | "planned"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "archived";

export type ProjectMetrics = {
  ticket_count: number;
  open_ticket_count: number;
  completed_ticket_count: number;
  member_count: number;
  total_estimated_minutes: number;
  remaining_estimated_minutes: number;
  total_tracked_seconds: number;
  progress_percent: number;
};

export type Project = {
  uid: string;
  organization_uid: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  priority: TopicPriority | null;
  lead_uid: string | null;
  lead_name: string | null;
  created_by_uid: string | null;
  created_by_name: string | null;
  start_date: string | null;
  target_date: string | null;
  color: string;
  is_active: boolean;
  metrics: ProjectMetrics;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  user_uid: string;
  name: string;
  email: string;
};

export type ProjectDetail = Project & {
  members: ProjectMember[];
  topic_count: number;
  tickets: TopicTicket[];
};

export type WorkspaceListResponse = {
  user: WorkspaceUser;
  workspaces: WorkspaceSummary[];
};

export type WorkspaceDashboard = {
  user: WorkspaceUser;
  workspace: WorkspaceSummary & {
    can_manage_members: boolean;
    can_manage_workspace_settings: boolean;
  };
  members: WorkspaceMember[];
  available_roles: Array<{
    value: WorkspaceRole;
    label: string;
  }>;
};

export type CreateMemberPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: WorkspaceRole;
};

export type TopicType =
  | "bug"
  | "feature"
  | "improvement"
  | "question"
  | "feedback"
  | "other";

export type TopicStatus =
  | "open"
  | "under_review"
  | "action_required"
  | "planned"
  | "converted_to_ticket"
  | "resolved"
  | "closed";

export type TopicPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type TopicTicket = {
  uid: string;
  reference: string;
  title: string;
  status:
    | "backlog"
    | "open"
    | "in_progress"
    | "in_review"
    | "completed"
    | "closed";
  priority: TopicPriority | null;
  estimated_minutes: number;
  due_date: string | null;
  project_uid: string;
  project_name: string;
  assignee_uid: string | null;
  assignee_name: string | null;
  total_tracked_seconds: number;
  active_timer: TicketTimeEntry | null;
  created_at: string;
};

export type TicketTimeEntry = {
  uid: string;
  user_uid: string;
  user_name: string;
  started_at: string;
  stopped_at: string | null;
  last_heartbeat_at: string;
  status: "progressing" | "completed";
  progress_seconds: number;
  duration_seconds: number;
  elapsed_seconds: number;
};

export type TicketOriginTopic = {
  uid: string;
  title: string;
  topic_type: TopicType;
  status: TopicStatus;
  is_deleted: boolean;
};

export type TicketDetailResponse = TopicTicket & {
  description: string;
  origin_topic: TicketOriginTopic | null;
  external_links: Array<{
    uid: string;
    provider: string;
    url: string;
    label: string;
    created_at: string;
  }>;
  time_entries: TicketTimeEntry[];
};

export type BoardTicket = {
  uid: string;
  reference: string;
  organization_slug: string;
  title: string;
  status:
    | "backlog"
    | "open"
    | "in_progress"
    | "in_review"
    | "completed"
    | "closed";
  priority: TopicPriority | null;
  estimated_minutes: number;
  due_date: string | null;
  project_uid: string;
  project_name: string;
  assignee_uid: string | null;
  assignee_name: string | null;
  total_tracked_seconds: number;
  active_timer: TicketTimeEntry | null;
  created_at: string;
};

export type TopicAttachment = {
  uid: string;
  original_name: string;
  content_type: string;
  size: number;
  url: string;
  uploaded_by_name: string;
  created_at: string;
};

export type TopicMention = {
  user_uid: string;
  name: string;
  email: string;
};

export type TopicComment = {
  uid: string;
  parent_uid: string | null;
  author_uid: string;
  author_name: string;
  body: string;
  mentions: TopicMention[];
  attachments: TopicAttachment[];
  created_at: string;
  updated_at: string;
};

export type TopicActivity = {
  event: string;
  description: string;
  actor_name: string;
  created_at: string;
};

export type TopicParticipant = {
  uid: string;
  name: string;
  email: string;
};

export type Topic = {
  uid: string;
  organization_uid: string;
  project_uid: string;
  project_name: string;
  title: string;
  description: string;
  topic_type: TopicType;
  status: TopicStatus;
  priority: TopicPriority | null;
  created_by_uid: string;
  created_by_name: string;
  is_pinned: boolean;
  is_locked: boolean;
  last_activity_at: string;
  comment_count: number;
  ticket_count: number;
  created_at: string;
  updated_at: string;
};

export type TopicDetail = Topic & {
  attachments: TopicAttachment[];
  participants: TopicParticipant[];
  comments: TopicComment[];
  tickets: TopicTicket[];
  solution: string;
  solution_url: string;
  solution_ticket: TopicTicket | null;
  activities: TopicActivity[];
};

export type TopicSuggestion = {
  uid: string;
  title: string;
  topic_type: TopicType;
  status: TopicStatus;
  score: number;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post("/api/auth/register", payload);
  return response.data;
}

export async function loginUser(payload: LoginPayload) {
  const response = await authApi.post<AuthResponse>("/api/auth/login", payload);
  setAccessToken(response.data.access);
  return response.data;
}

export async function logoutUser() {
  try {
    await authApi.post("/api/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export async function getWorkspaces() {
  const response = await api.get<WorkspaceListResponse>(
    "/api/workspaces/",
  );
  return response.data;
}

export async function createWorkspace(name: string) {
  const response = await api.post<WorkspaceSummary>(
    "/api/workspaces/",
    { name },
  );
  return response.data;
}

export async function updateWorkspace(slug: string, name: string) {
  const response = await api.patch<WorkspaceSummary>(
    `/api/workspaces/${encodeURIComponent(slug)}`,
    { name },
  );
  return response.data;
}

export async function deleteWorkspace(slug: string) {
  await api.delete(`/api/workspaces/${encodeURIComponent(slug)}`);
}

export async function activateWorkspace(slug: string) {
  const response = await api.post<WorkspaceSummary>(
    `/api/workspaces/${encodeURIComponent(slug)}/activate`,
  );
  return response.data;
}

export async function getWorkspaceDashboard(slug: string) {
  const response = await api.get<WorkspaceDashboard>(
    `/api/workspaces/${encodeURIComponent(slug)}/dashboard`,
  );
  return response.data;
}

export async function createWorkspaceMember(
  slug: string,
  payload: CreateMemberPayload,
) {
  const response = await api.post<{
    member: WorkspaceMember;
    created_user: boolean;
    email_sent: boolean;
  }>(
    `/api/workspaces/${encodeURIComponent(slug)}/members`,
    payload,
  );
  return response.data;
}

function topicBaseUrl(slug: string) {
  return `/api/workspaces/${encodeURIComponent(slug)}/topics`;
}

function projectBaseUrl(slug: string) {
  return `/api/workspaces/${encodeURIComponent(slug)}/projects`;
}

export async function getProjects(slug: string) {
  const response = await api.get<Project[]>(
    `${projectBaseUrl(slug)}/`,
  );
  return response.data;
}

export async function getProject(slug: string, key: string) {
  const response = await api.get<ProjectDetail>(
    `${projectBaseUrl(slug)}/${encodeURIComponent(key)}`,
  );
  return response.data;
}

export async function createProject(
  slug: string,
  payload: {
    name: string;
    key: string;
    description?: string;
    status?: ProjectStatus;
    priority?: TopicPriority | null;
    lead_uid?: string | null;
    member_user_uids?: string[];
    start_date?: string | null;
    target_date?: string | null;
    color?: string;
  },
) {
  const response = await api.post<Project>(
    `${projectBaseUrl(slug)}/`,
    payload,
  );
  return response.data;
}

export async function getTopics(slug: string) {
  const response = await api.get<Topic[]>(
    `${topicBaseUrl(slug)}/`,
  );
  return response.data;
}

export async function createTopic(
  slug: string,
  payload: {
    title: string;
    description: string;
    topic_type: TopicType;
    priority?: TopicPriority | null;
    project_uid: string;
  },
) {
  const response = await api.post<Topic>(
    `${topicBaseUrl(slug)}/`,
    payload,
  );
  return response.data;
}

export async function getTopic(slug: string, uid: string) {
  const response = await api.get<TopicDetail>(
    `${topicBaseUrl(slug)}/${encodeURIComponent(uid)}`,
  );
  return response.data;
}

export async function getSimilarTopics(
  slug: string,
  payload: {
    title?: string;
    description?: string;
    exclude_uid?: string;
  },
) {
  const response = await api.post<TopicSuggestion[]>(
    `${topicBaseUrl(slug)}/suggestions`,
    payload,
  );
  return response.data;
}

export async function updateTopicSolution(
  slug: string,
  topicUid: string,
  payload: {
    solution: string;
    solution_url: string;
    solution_ticket_uid: string | null;
  },
) {
  const response = await api.patch<Topic>(
    `${topicBaseUrl(slug)}/${encodeURIComponent(topicUid)}`,
    payload,
  );
  return response.data;
}

export async function deleteTopic(
  slug: string,
  topicUid: string,
  confirmation: string,
) {
  await api.delete(
    `${topicBaseUrl(slug)}/${encodeURIComponent(topicUid)}`,
    { data: { confirmation } },
  );
}

export async function createTopicComment(
  slug: string,
  topicUid: string,
  body: string,
  parentUid?: string,
) {
  const response = await api.post<TopicComment>(
    `${topicBaseUrl(slug)}/${encodeURIComponent(topicUid)}/comments`,
    { body, parent_uid: parentUid },
  );
  return response.data;
}

export async function uploadTopicAttachment(
  slug: string,
  topicUid: string,
  file: File,
) {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post<TopicAttachment>(
    `${topicBaseUrl(slug)}/${encodeURIComponent(topicUid)}/attachments`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

export async function createTicketFromTopic(
  slug: string,
  topicUid: string,
  payload: {
    title: string;
    description: string;
    priority: TopicPriority;
    project_uid: string;
    estimated_minutes?: number;
  },
) {
  const response = await api.post<TopicTicket>(
    `${topicBaseUrl(slug)}/${encodeURIComponent(topicUid)}/tickets`,
    payload,
  );
  return response.data;
}

export async function getTicket(slug: string, reference: string) {
  const response = await api.get<TicketDetailResponse>(
    `/api/workspaces/${encodeURIComponent(slug)}/tickets/${encodeURIComponent(reference)}`,
  );
  return response.data;
}

export async function createTicket(
  slug: string,
  payload: {
    project_uid: string;
    title: string;
    description: string;
    priority?: TopicPriority | null;
    estimated_minutes?: number;
    due_date?: string | null;
  },
) {
  const response = await api.post<TicketDetailResponse>(
    `/api/workspaces/${encodeURIComponent(slug)}/tickets/`,
    payload,
  );
  return response.data;
}

export async function deleteTicket(
  slug: string,
  reference: string,
  confirmation: string,
) {
  await api.delete(
    `/api/workspaces/${encodeURIComponent(slug)}/tickets/${encodeURIComponent(reference)}`,
    { data: { confirmation } },
  );
}

export async function getBoardTickets(
  slug: string,
  project?: string,
) {
  const response = await api.get<BoardTicket[]>(
    `/api/workspaces/${encodeURIComponent(slug)}/tickets/`,
    { params: project ? { project } : undefined },
  );
  return response.data;
}

export async function updateBoardTicket(
  slug: string,
  reference: string,
  payload: {
    status?: BoardTicket["status"];
    assignee_uid?: string | null;
    project_uid?: string;
    estimated_minutes?: number;
    due_date?: string | null;
  },
) {
  const response = await api.patch<BoardTicket>(
    `/api/workspaces/${encodeURIComponent(slug)}/tickets/${encodeURIComponent(reference)}`,
    payload,
  );
  return response.data;
}

export async function startTicketTimer(
  slug: string,
  reference: string,
) {
  const response = await api.post<BoardTicket>(
    `/api/workspaces/${encodeURIComponent(slug)}/tickets/${encodeURIComponent(reference)}/timer/start`,
  );
  return response.data;
}

export async function getActiveTicketTimer(slug: string) {
  const response = await api.get<BoardTicket | null>(
    `/api/workspaces/${encodeURIComponent(slug)}/tickets/timer/active`,
  );
  return response.data;
}

export async function stopTicketTimer(
  slug: string,
  reference: string,
) {
  const response = await api.post<BoardTicket>(
    `/api/workspaces/${encodeURIComponent(slug)}/tickets/${encodeURIComponent(reference)}/timer/stop`,
  );
  return response.data;
}

export async function heartbeatTicketTimer(
  slug: string,
  reference: string,
) {
  const response = await api.post<BoardTicket>(
    `/api/workspaces/${encodeURIComponent(slug)}/tickets/${encodeURIComponent(reference)}/timer/heartbeat`,
  );
  return response.data;
}
