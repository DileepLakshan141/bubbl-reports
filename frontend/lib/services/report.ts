/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/lib/axios/client";
import {
  Report,
  CreateDraftInput,
  UpdateDraftMetaInput,
  SubmitReportInput,
  ReviewReportInput,
  ReportListItem,
  SaveDraftInput,
  TeamMemberLatestReport,
} from "@/lib/types/report.type";
import { handleApiError } from "../utils";

const BASE_URL = "/api/backend/report";

export const getReports = async () => {
  try {
    const { data } = await apiClient.get<Report[]>(BASE_URL);
    return { success: true, reports: data };
  } catch (error: any) {
    return handleApiError(error, "Error while getting the reports");
  }
};

export const getReport = async (id: number) => {
  try {
    const { data } = await apiClient.get<Report>(`${BASE_URL}/${id}`);
    return { success: true, report: data };
  } catch (error: any) {
    return handleApiError(error, "Error while getting the report");
  }
};

export const createDraft = async (values: CreateDraftInput) => {
  try {
    const { data } = await apiClient.post<Report>(`${BASE_URL}/draft`, values);
    return { success: true, report: data };
  } catch (error: any) {
    return handleApiError(error, "Failed to create the draft");
  }
};

export const saveDraft = async (id: number, payload: SaveDraftInput) => {
  try {
    const { data } = await apiClient.patch<Report>(
      `${BASE_URL}/${id}/draft`,
      payload,
    );
    return { success: true as const, report: data };
  } catch (error) {
    return handleApiError(error, "Failed to save progress.");
  }
};

export const updateDraftMeta = async (
  id: number,
  values: UpdateDraftMetaInput,
) => {
  try {
    const { data } = await apiClient.patch<Report>(`${BASE_URL}/${id}`, values);
    return { success: true, report: data };
  } catch (error: any) {
    return handleApiError(error, "Failed to update the draft");
  }
};

// for handle both submission and resubmission cases when manager suggest a change
export const submitReport = async (id: number, values: SubmitReportInput) => {
  try {
    const { data } = await apiClient.post<Report>(
      `${BASE_URL}/${id}/submit`,
      values,
    );
    return { success: true, report: data };
  } catch (error: any) {
    return handleApiError(error, "Failed to submit the report");
  }
};

export const reviewReport = async (id: number, values: ReviewReportInput) => {
  try {
    const { data } = await apiClient.post<Report>(
      `${BASE_URL}/${id}/review`,
      values,
    );
    return { success: true, report: data };
  } catch (error: any) {
    return handleApiError(
      error,
      "Error while changing the state of the report",
    );
  }
};

export const getReportsByProject = async (projectId: number) => {
  try {
    const { data } = await apiClient.get<ReportListItem[]>(
      `${BASE_URL}?projectId=${projectId}`,
    );
    return { success: true as const, reports: data };
  } catch (error) {
    return handleApiError(error, "Failed to load reports.");
  }
};

export const getTeamReports = async (projectId: number) => {
  try {
    const { data } = await apiClient.get<TeamMemberLatestReport[]>(
      `${BASE_URL}/team/${projectId}`,
    );
    return { success: true as const, members: data };
  } catch (error) {
    return handleApiError(error, "Failed to load team reports.");
  }
};
