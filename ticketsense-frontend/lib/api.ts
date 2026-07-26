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
  | "manager"
  | "developer"
  | "support_agent"
  | "reporter";

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
