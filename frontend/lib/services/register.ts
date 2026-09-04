/* eslint-disable @typescript-eslint/no-explicit-any */

import { RegisterSchemaType } from "@/schemas/authSchema";
import { apiClient } from "../axios/client";
import { UserProfile } from "../types/auth.types";

export const register = async (values: RegisterSchemaType) => {
  try {
    const { data } = await apiClient.post<{
      user: UserProfile;
      message?: string;
    }>("/auth/register", values);
    return { success: true, user: data.user, message: data.message };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed.",
    };
  }
};
