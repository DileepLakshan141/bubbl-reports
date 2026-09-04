/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from "@/lib/axios/client";
import { LoginSchemaType } from "../../schemas/authSchema";
import { UserProfile } from "../types/auth.types";

export const login = async (values: LoginSchemaType) => {
  try {
    const { data } = await apiClient.post<{
      user: UserProfile;
      message?: string;
    }>("/auth/login", values);
    return { success: true, user: data.user, message: data.message };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed.",
    };
  }
};
