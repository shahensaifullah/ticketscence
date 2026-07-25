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
  organization_name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
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
