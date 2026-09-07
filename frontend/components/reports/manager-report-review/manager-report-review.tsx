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
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getReport, reviewReport } from "@/lib/services/report";
import { Report, ReportVersion } from "@/lib/types/report.type";
import ReportContent from "../report-content/report-content";

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
    getReport(reportId).then((result) => {
      if (result.success) {
        setReport(result.report);
        setVersion(
          result.report.versions.find((v) => v.id === versionId) ?? null,
        );
      } else {
        toast.error(result.message, toastStyle.error);
      }
      setLoading(false);
    });
  }, [reportId, versionId]);

  if (loading)
    return (
      <div className="w-full h-60 flex justify-center items-center">
        <Spinner className="size-8" />
      </div>
    );
  if (!report || !version)
    return (
      <p className="text-center text-muted-foreground py-10">
        Version not found.
      </p>
    );

  const canReview =
    report.currentVersionId === version.id && version.status === "SUBMITTED";

  const progressData = version.tasks
    .filter((t) => !t.isFutureTask)
    .map((t) => ({
      name: t.name.length > 14 ? t.name.slice(0, 14) + "…" : t.name,
      planned: t.plannedProgress,
      actual: t.actualProgress,
    }));
  const statusCounts = version.tasks.reduce<Record<string, number>>(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));
  const typeCounts = version.tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.type] = (acc[t.type] ?? 0) + 1;
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
      toast.error(result.message, toastStyle.error);
      return;
    }
    toast.success(
      pendingAction === "APPROVE"
        ? "Report approved"
        : "Sent back for correction",
      toastStyle.success,
    );
    setPendingAction(null);
    router.push(`/dashboard/team/${report.projectId}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0 pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold">{report.name}</h1>
          <p className="text-xs text-muted-foreground">{version.status}</p>
        </div>
        {canReview && (
          <Select
            onValueChange={(v) =>
              openConfirm(v as "APPROVE" | "NEEDS_CORRECTION")
            }
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Change report status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="APPROVE">Approve</SelectItem>
              <SelectItem value="NEEDS_CORRECTION">
                Request correction
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator className="mb-6" />

      <Tabs defaultValue="completion">
        <TabsList>
          <TabsTrigger value="completion">Completion report</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="completion" className="pt-6">
          <ReportContent
            version={version}
            creatorName={report.creator?.username}
          />
        </TabsContent>

        <TabsContent value="analytics" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border p-4">
              <h2 className="text-sm font-semibold mb-3">
                Planned vs actual progress
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="planned"
                    stroke="#378ADD"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#1D9E75"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border p-4">
              <h2 className="text-sm font-semibold mb-3">Tasks by status</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border p-4 md:col-span-2">
              <h2 className="text-sm font-semibold mb-3">Tasks by type</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "APPROVE"
                ? "Approve this report?"
                : "Request correction?"}
            </DialogTitle>
            <DialogDescription>
              This action is not reversible.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="review-comment">
              Comment {pendingAction === "NEEDS_CORRECTION" && "(required)"}
            </FieldLabel>
            <Textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentError(null);
              }}
            />
            {commentError && (
              <FieldError errors={[{ message: commentError }]} />
            )}
          </Field>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              }
            />
            <Button
              variant={
                pendingAction === "NEEDS_CORRECTION" ? "destructive" : "default"
              }
              onClick={confirmAction}
              disabled={submitting}
            >
              {submitting && <Spinner className="mr-2 size-4" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerReportReview;
