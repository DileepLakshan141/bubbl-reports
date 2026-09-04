/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/lib/axios/client";

export async function logoutUser() {
  try {
    const { data } = await apiClient.post<{ success: boolean }>("/auth/logout");
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Logout failed",
    };
  }
}
