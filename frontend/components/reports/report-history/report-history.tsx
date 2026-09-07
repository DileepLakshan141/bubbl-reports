/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  History,
  FolderKanban,
  User as UserIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  FileText,
} from "lucide-react";

import { findVersionHistory } from "@/lib/services/report";
import { findAllProjects } from "@/lib/services/project";
import { ReportVersionHistoryItem } from "@/lib/types/report.type";
import { Project } from "@/lib/types/project.types";
import { Role } from "@/lib/types/auth.types";
import EmptyTemplate from "../../empty-template/empty-template";

const STATUS_OPTIONS = ["DRAFT", "SUBMITTED", "NEEDS_CORRECTION", "APPROVED"];

function monthKey(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

interface ReportHistoryProps {
  userId: number;
  userRole: Role;
}

const ReportHistory = ({ userRole }: ReportHistoryProps) => {
  const router = useRouter();
  const isTeamMember = userRole === "TEAM_MEMBER";

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitterFilter, setSubmitterFilter] = useState("all");
  const [submitters, setSubmitters] = useState<
    { id: number; username: string }[]
  >([]);

  const [versions, setVersions] = useState<ReportVersionHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isTeamMember) return;
    findAllProjects().then((result) => {
      if (result.success) setProjects(result.projects);
    });
  }, [isTeamMember]);

  useEffect(() => {
    setLoading(true);
    findVersionHistory({
      projectId: projectFilter !== "all" ? Number(projectFilter) : undefined,
      submittedBy:
        !isTeamMember && submitterFilter !== "all"
          ? Number(submitterFilter)
          : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      page,
      limit: 20,
    }).then((result) => {
      setLoading(false);
      if (!result.success) return;
      setVersions(result.versions);
      setTotalPages(result.totalPages);

      if (!isTeamMember) {
        const unique = new Map(
          result.versions.map((v) => [v.report.creator.id, v.report.creator]),
        );
        setSubmitters((prev) => {
          const merged = new Map(prev.map((u) => [u.id, u]));
          unique.forEach((u, id) => merged.set(id, u));
          return Array.from(merged.values());
        });
      }
    });
  }, [projectFilter, statusFilter, submitterFilter, page, isTeamMember]);

  useEffect(() => {
    setPage(1);
  }, [projectFilter, statusFilter, submitterFilter]);

  const grouped = versions.reduce<Record<string, ReportVersionHistoryItem[]>>(
    (acc, v) => {
      const key = monthKey(v.createdAt);
      (acc[key] ??= []).push(v);
      return acc;
    },
    {},
  );

  const selectedProjectLabel =
    projectFilter === "all"
      ? "All Projects"
      : (projects.find((p) => String(p.id) === projectFilter)?.name ??
        "Project");

  const selectedSubmitterLabel =
    submitterFilter === "all"
      ? "Everyone"
      : (submitters.find((u) => String(u.id) === submitterFilter)?.username ??
        "Submitter");

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 px-2 sm:px-0">
      {/* header part */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Report History
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isTeamMember
              ? "Comprehensive timeline of all your submitted report versions."
              : "Audit trail of every report version submitted across all teams."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* status selector */}
        <div className="w-full sm:w-auto sm:max-w-[220px] flex-1">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? "all")}
          >
            <SelectTrigger className="w-full text-xs h-9 bg-background">
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <SelectValue>
                  {statusFilter === "all"
                    ? "All Statuses"
                    : statusFilter.replace("_", " ")}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="capitalize">
                    {s.replace("_", " ").toLowerCase()}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isTeamMember && (
          <>
            {/* project setter */}
            <div className="w-full sm:w-auto sm:max-w-[220px] flex-1">
              <Select
                value={projectFilter}
                onValueChange={(v) => setProjectFilter(v ?? "all")}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-background">
                  <div className="flex items-center gap-2 truncate">
                    <FolderKanban className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue>{selectedProjectLabel}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* reported by */}
            <div className="w-full sm:w-auto sm:max-w-[220px] flex-1">
              <Select
                value={submitterFilter}
                onValueChange={(v) => setSubmitterFilter(v ?? "all")}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-background">
                  <div className="flex items-center gap-2 truncate">
                    <UserIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue>{selectedSubmitterLabel}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  {submitters.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      @{u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {/* result displayer */}
      {loading ? (
        <div className="w-full h-64 flex flex-col justify-center items-center gap-2">
          <Spinner className="size-8 text-primary" />
          <p className="text-xs text-muted-foreground">
            Fetching report history...
          </p>
        </div>
      ) : versions.length === 0 ? (
        <EmptyTemplate
          icon={FileText}
          title="No report versions found"
          description="There are no report entries matching the selected filter
                criteria. Try adjusting your filters."
          tailwindHeight="h-40"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthVersions]) => (
            <div key={month} className="space-y-2.5">
              {/* Timeline Month Divider */}
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {month}
                </h2>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <div className="grid grid-cols-1 gap-2">
                {monthVersions.map((v) => (
                  <div
                    key={v.id}
                    onClick={() =>
                      router.push(
                        `/dashboard/reports/${v.reportId}/versions/${v.id}`,
                      )
                    }
                    className="group cursor-pointer rounded-lg border border-border/80 bg-card p-3 sm:px-4 sm:py-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    {/* Left Column / Top Section: Title & Details */}
                    <div className="min-w-0 flex flex-col justify-center gap-1.5 sm:gap-1">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {v.report.name}
                      </p>

                      {/* Metadata Row: Stacks vertically on mobile, horizontally on desktop */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-x-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80 truncate">
                          {v.report.project.name}
                        </span>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {!isTeamMember && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center gap-1 shrink-0">
                                <UserIcon className="w-3 h-3 text-muted-foreground" />
                                @{v.report.creator.username}
                              </span>
                            </>
                          )}

                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {v.submittedAt
                              ? `Submitted ${formatDateTime(v.submittedAt)}`
                              : `Created ${formatDateTime(v.createdAt)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column / Bottom Section: Status Badge */}
                    <div className="flex sm:shrink-0 items-center justify-start sm:justify-end pt-1 sm:pt-0 border-t border-border/40 sm:border-t-0">
                      <StatusBadge status={v.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1 h-8 text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </Button>

          <span className="text-xs text-muted-foreground font-medium">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1 h-8 text-xs"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status?: string }) => {
  const normalized = status?.toLowerCase();
  switch (normalized) {
    case "approved":
      return (
        <Badge
          variant="outline"
          className="mt-2 bg-[var(--status-approved-bg)] text-[var(--status-approved)] border-transparent capitalize font-medium shrink-0"
        >
          {status}
        </Badge>
      );
    case "submitted":
      return (
        <Badge
          variant="outline"
          className="mt-2 bg-[var(--status-submitted-bg)] text-[var(--status-submitted)] border-transparent capitalize font-medium shrink-0"
        >
          {status}
        </Badge>
      );
    case "needs_correction":
    case "needs correction":
      return (
        <Badge
          variant="outline"
          className="mt-2 bg-[var(--status-correction-bg)] text-[var(--status-correction)] border-transparent capitalize font-medium shrink-0"
        >
          Needs Correction
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-[var(--status-draft-bg)] text-[var(--status-draft)] border-transparent capitalize font-medium shrink-0"
        >
          {status ?? "Draft"}
        </Badge>
      );
  }
};

export default ReportHistory;
