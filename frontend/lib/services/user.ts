import { apiClient } from "../axios/client";
import { User } from "../types/auth.types";
import { handleApiError } from "../utils";

const BASE_URL = "/api/backend/users";

export const searchUsersByEmail = async (email: string) => {
  try {
    const { data } = await apiClient.get<User[]>(
      `${BASE_URL}/search?email=${encodeURIComponent(email)}`,
    );
    return { success: true as const, users: data };
  } catch (error) {
    return handleApiError(error, "Failed to search users.");
  }
};

export const findUsersPaginated = async (params: {
  search?: string;
  projectId?: number;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.projectId) query.set("projectId", String(params.projectId));
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));

  try {
    const { data } = await apiClient.get<{
      users: User[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`${BASE_URL}?${query.toString()}`);
    return { success: true as const, ...data };
  } catch (error) {
    return handleApiError(error, "Failed to load users.");
  }
};

export const updateUserRole = async (id: number, role: string) => {
  try {
    console.log(id);

    const { data } = await apiClient.patch<User>(`${BASE_URL}/${id}/role`, {
      role,
    });
    return { success: true as const, user: data };
  } catch (error) {
    return handleApiError(error, "Failed to update role.");
  }
};
