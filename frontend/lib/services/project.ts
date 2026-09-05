import { AxiosError } from "axios";
import { apiClient } from "../axios/client";
import {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "../types/project.types";

const BASE_URL = "/api/backend/project";

const handleApiError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof AxiosError) {
    return {
      success: false as const,
      message: error.response?.data?.message || fallbackMessage,
    };
  }
  return {
    success: false as const,
    message: fallbackMessage,
  };
};

export const findAllProjects = async () => {
  try {
    const { data } = await apiClient.get<Project[]>(BASE_URL);
    return { success: true as const, projects: data };
  } catch (error) {
    return handleApiError(error, "Failed to load projects.");
  }
};

export const findProjectById = async (id: number) => {
  try {
    const { data } = await apiClient.get<Project>(`${BASE_URL}/${id}`);
    return { success: true as const, project: data };
  } catch (error) {
    return handleApiError(error, "Failed to load project.");
  }
};

export const findAssignedProjects = async (id: number) => {
  try {
    const { data } = await apiClient.get<Project[]>(
      `${BASE_URL}/${id}/assigned-projects`,
    );
    return { success: true as const, projects: data };
  } catch (error) {
    return handleApiError(error, "Failed to load assigned project.");
  }
};

export const createProject = async (payload: CreateProjectInput) => {
  try {
    const { data } = await apiClient.post<Project>(BASE_URL, payload);
    return { success: true as const, project: data };
  } catch (error) {
    return handleApiError(error, "Failed to create the project.");
  }
};

export const updateProject = async (
  id: number,
  payload: UpdateProjectInput,
) => {
  try {
    const { data } = await apiClient.patch<Project>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return { success: true as const, project: data };
  } catch (error) {
    return handleApiError(error, "Failed to update project.");
  }
};

export const assignEmployee = async (projectId: number, userId: number) => {
  try {
    const { data } = await apiClient.post(
      `${BASE_URL}/${projectId}/assignments`,
      {
        userId,
      },
    );
    return { success: true, assignment: data };
  } catch (error) {
    handleApiError(error, "Failed to assign the employee");
  }
};

export const removeEmployee = async (projectId: number, userId: number) => {
  try {
    await apiClient.delete(`${BASE_URL}/${projectId}/assignments/${userId}`);
    return { success: true };
  } catch (error) {
    handleApiError(error, "Failed to remove the employee");
  }
};
