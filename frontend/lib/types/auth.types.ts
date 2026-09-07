import { AxiosRequestConfig } from "axios";

export type Role = "ADMIN" | "MANAGER" | "TEAM_MEMBER";

export interface Session {
  sub: number;
  email: string;
  username: string;
  role: Role;
}

export type BackendRequestConfig = AxiosRequestConfig;

export interface ProxyOptions extends BackendRequestConfig {
  path: string;
}

export interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; username: string; role: string };
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  role: Role;
}

export interface AuthState {
  user: UserProfile | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isVerified: boolean;
}

export type User = UserProfile;
