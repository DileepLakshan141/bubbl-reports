"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  Calendar,
  ShieldAlert,
  Send,
  Clock,
  AlertTriangle,
  Trophy,
  MessageSquare,
  User,
  Calendar1,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { getReport, reviewReport } from "@/lib/services/report";
import { Report, ReportVersion, Task } from "@/lib/types/report.type";

const PIE_COLORS = [
  "#378ADD",
  "#1D9E75",
  "#BA7517",
  "#D85A30",
  "#A32D2D",
  "#7F77DD",
];

const toastStyle = {
  success: { style: { borderLeft: "4px solid #16a34a" } },
  error: { style: { borderLeft: "4px solid #dc2626" } },
};

const ManagerReportReview = ({
  reportId,
  versionId,
}: {
  reportId: number;
  versionId: number;
}) => {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [version, setVersion] = useState<ReportVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<
    "APPROVE" | "NEEDS_CORRECTION" | null
  >(null);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getReport(reportId).then((result) => {
      if (!isMounted) return;

      if (result.success && "report" in result) {
        setReport(result.report);
        setVersion(
          result.report.versions?.find((v) => v.id === versionId) ?? null,
        );
      } else if ("message" in result) {
        toast.error(result.message, toastStyle.error);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [reportId, versionId]);

  if (loading)
    return (
      <div className="w-full h-60 flex justify-center items-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );

  if (!report || !version)
    return (
      <Card className="max-w-xl mx-auto my-12 text-center p-8 shadow-sm">
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Report Version Not Found</CardTitle>
          <p className="text-sm text-muted-foreground">
            The requested version review could not be found or has been removed.
          </p>
        </CardContent>
      </Card>
    );

  const canReview =
    report.currentVersionId === version.id && version.status === "SUBMITTED";

  // Safe extractions
  const tasks = version.tasks ?? [];
  const blockers = version.blockers ?? [];
  const achievements = version.achievements ?? [];
  const comments = version.comments ?? [];

  // Group tasks
  const currentTasks = tasks.filter((t) => !t.isFutureTask);
  const futureTasks = tasks.filter((t) => Boolean(t.isFutureTask));

  // Analytics data calculations
  const progressData = currentTasks.map((t) => ({
    name: t.name.length > 14 ? t.name.slice(0, 14) + "…" : t.name,
    planned: t.plannedProgress ?? 0,
    actual: t.actualProgress ?? 0,
  }));

  const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    if (t.status) {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
    }
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const typeCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    if (t.type) {
      acc[t.type] = (acc[t.type] ?? 0) + 1;
    }
    return acc;
  }, {});

  const typeData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const openConfirm = (action: "APPROVE" | "NEEDS_CORRECTION") => {
    setPendingAction(action);
    setComment("");
    setCommentError(null);
  };

  const confirmAction = async () => {
    if (pendingAction === "NEEDS_CORRECTION" && comment.trim().length < 3) {
      setCommentError("Please explain what needs to change.");
      return;
    }
    setSubmitting(true);
    const result = await reviewReport(reportId, {
      action: pendingAction!,
      comment: comment.trim() || undefined,
    });
    setSubmitting(false);
    if (!result.success) {
      const errorMessage =
        "message" in result ? result.message : "Action failed";
      toast.error(errorMessage, toastStyle.error);
      return;
    }
    toast.success(
      pendingAction === "APPROVE"
        ? "Report approved"
        : "Sent back for correction",
      toastStyle.success,
    );
    setPendingAction(null);
    router.push(`/dashboard/projects/${report.projectId}/team`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header Context Banner */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {report.name}
                </h1>
                <StatusBadge status={version.status} />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                Report ID: #{reportId} • Version ID: #{versionId}
                {report.creator?.username && (
                  <span>• Author: @{report.creator.username}</span>
                )}
              </p>
            </div>

            {/* Manager Actions Dropdown */}
            {canReview && (
              <div className="w-full sm:w-auto">
                <Select
                  value=""
                  onValueChange={(v) =>
                    openConfirm(v as "APPROVE" | "NEEDS_CORRECTION")
                  }
                >
                  <SelectTrigger className="w-full sm:w-56 transition-colors">
                    <SelectValue placeholder="Take Review Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVE" className="cursor-pointer">
                      <span className="flex items-center gap-2 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Approve Report
                      </span>
                    </SelectItem>
                    <SelectItem
                      value="NEEDS_CORRECTION"
                      className="cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-amber-600 font-medium">
                        <AlertCircle className="w-4 h-4" /> Request Correction
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="completion" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="completion" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Report
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Report Tab */}
        <TabsContent value="completion" className="pt-4 space-y-6">
          {/* Period / Current Tasks Section */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Period Tasks
                </CardTitle>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {currentTasks.length}{" "}
                {currentTasks.length === 1 ? "Task" : "Tasks"}
              </Badge>
            </CardHeader>
            <CardContent>
              {currentTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No period tasks recorded for this report version.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {currentTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Planned Future Tasks Section */}
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
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {futureTasks.map((task) => (
                    <TaskCard key={task.id} task={task} isFuture />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blockers and Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blockers & Issues */}
            {blockers.length > 0 && (
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
                    {blockers.map((b, i) => (
                      <li
                        key={b.id ?? i}
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

            {/* Key Achievements */}
            {achievements.length > 0 && (
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
                    {achievements.map((a, i) => (
                      <li
                        key={a.id ?? i}
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

          {/* Feedback & Review Comments */}
          {comments.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    Review History & Feedback
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {comments.map((c, i) => (
                  <div
                    key={c.id ?? i}
                    className="rounded-xl border border-border p-4 bg-card/60 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="capitalize text-xs font-semibold"
                      >
                        {c.action}
                      </Badge>
                      {report.creator?.username && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" /> @
                          {report.creator.username}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {c.comment}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Progress comparison */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Planned vs Actual Progress
                </CardTitle>
                <CardDescription className="text-xs">
                  Percentage completion across non-future tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="planned"
                      name="Planned %"
                      stroke="#378ADD"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actual %"
                      stroke="#1D9E75"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2: Status distribution */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Tasks by Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of task execution statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={75}
                      innerRadius={35}
                      paddingAngle={4}
                      label={({ name, percent = 0 }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {statusData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 3: Type breakdown */}
            <Card className="shadow-sm md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Tasks by Type
                </CardTitle>
                <CardDescription className="text-xs">
                  Breakdown of workload categories
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      paddingAngle={3}
                      label
                    >
                      {typeData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction === "APPROVE" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Approve Report
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  Request Correction
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === "APPROVE"
                ? "This will mark the current version as officially approved."
                : "The author will be requested to make revisions and resubmit the report."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="review-comment" className="text-xs font-semibold">
              Feedback Comment{" "}
              {pendingAction === "NEEDS_CORRECTION" ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              )}
            </Label>
            <Textarea
              id="review-comment"
              rows={4}
              placeholder={
                pendingAction === "NEEDS_CORRECTION"
                  ? "Detail the specific updates required before approval..."
                  : "Add optional feedback or confirmation notes..."
              }
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentError(null);
              }}
              className="resize-none"
            />
            {commentError && (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {commentError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose>Cancel</DialogClose>
            <Button
              variant={
                pendingAction === "NEEDS_CORRECTION" ? "destructive" : "default"
              }
              onClick={confirmAction}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <Spinner className="size-4" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Reusable Task Progress Card Component
const TaskCard = ({
  task,
  isFuture = false,
}: {
  task: Task;
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
          <Clock className="w-3 h-3" /> Logged {task.timeSpent ?? 0}h /{" "}
          {task.timePlanned ?? 0}h planned
          {task.type && (
            <span className="capitalize text-[11px] px-1.5 py-0.2 rounded bg-muted/60">
              • {task.type.toLowerCase()}
            </span>
          )}
        </p>
      </div>
      <Badge variant="outline" className="text-xs font-normal capitalize">
        {task.status ? task.status.replace("_", " ").toLowerCase() : "pending"}
      </Badge>
    </div>

    {/* Dual Progress Bars */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Planned Progress</span>
          <span className="font-medium text-foreground">
            {task.plannedProgress ?? 0}%
          </span>
        </div>
        <Progress value={task.plannedProgress ?? 0} className="h-1.5" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Actual Progress</span>
          <span className="font-medium text-foreground">
            {task.actualProgress ?? 0}%
          </span>
        </div>
        <Progress value={task.actualProgress ?? 0} className="h-1.5" />
      </div>
    </div>
  </div>
);

// Helper Status Badge
const StatusBadge = ({ status }: { status?: string }) => {
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
          {status ?? "Draft"}
        </Badge>
      );
  }
};

export default ManagerReportReview;
