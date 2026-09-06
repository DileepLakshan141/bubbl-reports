import { Role } from "./auth.types";

export interface DashboardHomeProps {
  userId: number;
}

export interface DashboardProjectsProps extends DashboardHomeProps {
  userRole: Role;
}

export type DashboardAssignedProjectsProps = DashboardHomeProps;

export interface AssignedMember {
  id: number;
  projectId: number;
  userId: number;
  user: { id: number; username: string };
}

export interface ProjectReadInfo {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}
export interface ProjectAssignment {
  id: number;
  project: ProjectReadInfo;
}
export interface Project {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  assignments?: AssignedMember[];
}
export interface ProjectCardActions {
  onView?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export type ProjectCardProps = Project & ProjectCardActions;

export interface ProjectCardReadOnlyProps {
  project: ProjectReadInfo;
  onView?: () => void;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  isActive?: boolean;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface ApiFailure {
  success: false;
  message: string;
}

export interface FindProjectsSuccess {
  success: true;
  projects: Project[];
}

export type FindProjectsResult = FindProjectsSuccess | ApiFailure;

export interface FindAssignedProjectsSuccess {
  success: true;
  projects: ProjectAssignment[];
}

export type FindAssignedProjectsResult =
  | FindAssignedProjectsSuccess
  | ApiFailure;
