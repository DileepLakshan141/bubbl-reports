import "server-only";
import axios, { AxiosError } from "axios";

if (!process.env.NEST_API_URL) {
  throw new Error("NEST_API_URL is not found please check your .env.local");
}

export function createBackendClient(accessToken?: string) {
  return axios.create({
    baseURL: process.env.NEST_API_URL,
    timeout: 10_000,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}

export function toBffError(error: unknown): {
  status: number;
  message: string;
} {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ message?: string | string[] }>;
    const status = err.response?.status ?? 502;
    const raw = err.response?.data?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : (raw ?? "Upstream request failed");
    return { status, message };
  }
  return { status: 500, message: "Unexpected server error" };
}
