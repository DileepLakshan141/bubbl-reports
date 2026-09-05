export interface DashboardHomeProps {
  userId: number;
}

export interface AssignedMember {
  id: number;
  projectId: number;
  userId: number;
  user: { id: number; username: string };
}

export interface Project {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  assignments: AssignedMember[];
}

export interface CreateProjectInput {
  name: string;
  description: string;
  isActive?: boolean;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;
