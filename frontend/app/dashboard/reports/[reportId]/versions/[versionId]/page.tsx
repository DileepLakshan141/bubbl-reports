/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, use } from "react";
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  MessageSquare,
  Clock,
  Eye,
  FileText,
  ListTodo,
  Calendar1,
} from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { Report } from "@/lib/types/report.type";
import { getReport } from "@/lib/services/report";

const ReadOnlyVersionPage = ({
  params,
}: {
  params: Promise<{ reportId: string; versionId: string }>;
}) => {
  const { reportId, versionId } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getReport(Number(reportId)).then((result) => {
      if (cancelled) return;
      if (result.success) setReport(result.report);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (loading) {
    return (
      <div className="w-full h-60 flex justify-center items-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  const version = report?.versions?.find((v) => v.id === Number(versionId));

  if (!version) {
    return (
      <Card className="max-w-xl mx-auto my-12 text-center p-8 shadow-sm">
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Version Not Found</CardTitle>
          <p className="text-sm text-muted-foreground">
            The historical report version you are looking for does not exist or
            has been removed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter tasks into current/historical and future groups
  const currentTasks = version.tasks.filter((t) => !t.isFutureTask);
  const futureTasks = version.tasks.filter((t) => Boolean(t.isFutureTask));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-3.5 px-4 rounded-xl border border-border bg-card shadow-sm text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-[var(--status-info-bg)] text-[var(--status-info)] border-transparent font-medium"
          >
            <Eye className="w-3 h-3 mr-1" /> Archived Snapshot
          </Badge>
          <span>You are viewing a read-only version.</span>
        </div>
      </div>

      {/* Main Header */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {report?.name}
                </h1>
                <StatusBadge status={version.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Report ID: #{reportId} • Version ID: #{versionId}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current / Period Tasks Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--brand-blue)]" />
            <CardTitle className="text-base font-semibold">
              Period Tasks
            </CardTitle>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {currentTasks.length} {currentTasks.length === 1 ? "Task" : "Tasks"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No period tasks recorded for this version.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {currentTasks.map((task, i) => (
                <TaskCard key={i} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future / Planned Tasks Section */}
      {futureTasks.length > 0 && (
        <Card className="shadow-sm border-dashed">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Calendar1 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-base font-semibold">
                Planned Future Tasks
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-transparent"
            >
              {futureTasks.length}{" "}
              {futureTasks.length === 1 ? "Future Task" : "Future Tasks"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {futureTasks.map((task, i) => (
                <TaskCard key={i} task={task} isFuture />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Layout for Blockers and Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blockers Section */}
        {version.blockers.length > 0 && (
          <Card className="shadow-sm border-[var(--status-correction-bg)] dark:border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--brand-persimmon)]" />
                <CardTitle className="text-base font-semibold">
                  Blockers & Issues
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {version.blockers.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--status-critical-bg)] text-sm"
                  >
                    <span className="size-1.5 rounded-full bg-[var(--brand-persimmon)] mt-2 shrink-0" />
                    <div className="flex-1">
                      <span className="text-foreground font-medium">
                        {b.name}
                      </span>
                      {b.isKeyIssue && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px] bg-[var(--brand-persimmon)]/10 text-[var(--brand-persimmon)] border-transparent uppercase font-bold"
                        >
                          Key Issue
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Achievements Section */}
        {version.achievements.length > 0 && (
          <Card className="shadow-sm border-[var(--status-approved-bg)] dark:border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[var(--status-approved)]" />
                <CardTitle className="text-base font-semibold">
                  Key Achievements
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {version.achievements.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--status-approved-bg)] text-sm"
                  >
                    <span className="size-1.5 rounded-full bg-[var(--status-approved)] mt-2 shrink-0" />
                    <div className="flex-1">
                      <span className="text-foreground font-medium">
                        {a.name}
                      </span>
                      {a.isKeyAchievement && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px] bg-[var(--status-approved)]/20 text-[var(--status-approved)] border-transparent uppercase font-bold"
                        >
                          Key Win
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Comments Section */}
      {version.comments.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[var(--brand-blue)]" />
              <CardTitle className="text-base font-semibold">
                Review History & Feedback
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {version.comments.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-border p-4 bg-card/60 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="capitalize text-xs font-semibold"
                  >
                    {c.action}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {c.comment}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const TaskCard = ({
  task,
  isFuture = false,
}: {
  task: any;
  isFuture?: boolean;
}) => (
  <div
    className={`rounded-xl border border-border p-4 bg-card/50 flex flex-col gap-3 transition-colors hover:bg-muted/30 ${
      isFuture ? "border-purple-500/20 bg-purple-500/5" : ""
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-foreground">{task.name}</h3>
          {isFuture && (
            <Badge
              variant="outline"
              className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-transparent font-normal"
            >
              Upcoming
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
          <Clock className="w-3 h-3" /> Logged {task.timeSpent}h /{" "}
          {task.timePlanned}h planned
        </p>
      </div>
      <Badge variant="outline" className="text-xs font-normal capitalize">
        {task.status}
      </Badge>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Planned Progress</span>
          <span className="font-medium text-foreground">
            {task.plannedProgress}%
          </span>
        </div>
        <Progress value={task.plannedProgress} className="h-1.5" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Actual Progress</span>
          <span className="font-medium text-foreground">
            {task.actualProgress}%
          </span>
        </div>
        <Progress value={task.actualProgress} className="h-1.5" />
      </div>
    </div>
  </div>
);

// Status Badge Helper
const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status?.toLowerCase();
  switch (normalized) {
    case "approved":
      return (
        <Badge
          variant="outline"
          className="bg-[var(--status-approved-bg)] text-[var(--status-approved)] border-transparent capitalize font-medium"
        >
          {status}
        </Badge>
      );
    case "submitted":
      return (
        <Badge
          variant="outline"
          className="bg-[var(--status-submitted-bg)] text-[var(--status-submitted)] border-transparent capitalize font-medium"
        >
          {status}
        </Badge>
      );
    case "needs_correction":
    case "needs correction":
      return (
        <Badge
          variant="outline"
          className="bg-[var(--status-correction-bg)] text-[var(--status-correction)] border-transparent capitalize font-medium"
        >
          Needs Correction
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-[var(--status-draft-bg)] text-[var(--status-draft)] border-transparent capitalize font-medium"
        >
          {status}
        </Badge>
      );
  }
};

export default ReadOnlyVersionPage;
