import axios from "axios";

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  organization_name: string;
  email: string;
  password: string;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post("/api/auth/register", payload);
  return response.data;
}
