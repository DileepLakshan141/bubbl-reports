// lib/types/report.types.ts

export interface Task {
  name: string;
  priority: string;
  type: string;
  status: string;
  plannedProgress: number;
  actualProgress: number;
  timePlanned: number;
  timeSpent: number;
  output?: string;
  isFutureTask: boolean;
}

export interface Blocker {
  name: string;
  isKeyIssue: boolean;
}

export interface Achievement {
  name: string;
  isKeyAchievement: boolean;
}

export interface OptionalNote {
  id: number;
  reportVersionId: number;
  content: string;
}

export interface Comment {
  id: number;
  reportVersionId: number;
  reviewerId: number;
  action: string;
  comment: string;
  createdAt: string;
}

// A single version, WITH its children — this is what fullInclude() returns
// nested inside both `versions[]` and `currentVersion` on a Report.
export interface ReportVersion {
  id: number;
  reportId: number;
  status: string;
  submittedAt: string | null;
  createdAt: string;
  tasks: Task[];
  blockers: Blocker[];
  achievements: Achievement[];
  notes: OptionalNote[];
  comments: Comment[];
}

// The full Report shape as returned by findOne()/createDraft()/submit()/review(),
// i.e. anywhere the backend uses fullInclude().
export interface Report {
  id: number;
  projectId: number;
  currentVersionId: number | null;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  project: { id: number; name: string };
  creator?: { id: number; username: string }; // present when the backend include is added
  versions: ReportVersion[];
  currentVersion: ReportVersion | null;
}

// The lighter shape returned by findAll() — currentVersion only, no full
// versions array, since the list view doesn't need version history.
export interface ReportListItem {
  id: number;
  projectId: number;
  currentVersionId: number | null;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  project: { id: number; name: string };
  creator: { id: number; username: string };
  currentVersion: {
    id: number;
    status: string;
    submittedAt: string | null;
  } | null;
}

// ---- Request payload types ----

export interface CreateDraftInput {
  projectId: number;
  name?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateDraftMetaInput {
  name?: string;
  startDate?: string;
  endDate?: string;
}

export interface SubmitReportInput {
  tasks: Task[];
  blockers?: Blocker[];
  achievements?: Achievement[];
  notes?: string;
}

export interface ReviewReportInput {
  action: "APPROVE" | "NEEDS_CORRECTION";
  comment?: string;
}

export interface SaveDraftInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  tasks?: Task[];
  blockers?: Blocker[];
  achievements?: Achievement[];
  notes?: string;
}
