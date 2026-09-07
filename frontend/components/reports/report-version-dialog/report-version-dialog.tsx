/* eslint-disable react-hooks/set-state-in-effect */
// components/reports/report-versions-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getReport } from "../../../lib/services/report";
import { Report } from "@/lib/types/report.type";
import { Separator } from "../../ui/separator";
import { Badge } from "../../ui/badge";

interface ReportVersionsDialogProps {
  reportId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

const ReportVersionsDialog = ({
  reportId,
  open,
  onOpenChange,
}: ReportVersionsDialogProps) => {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    getReport(reportId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.success) setReport(result.report);
    });

    return () => {
      cancelled = true;
    };
  }, [open, reportId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            Report versions
          </DialogTitle>
          <DialogDescription>
            Every version of this report, oldest first. Click one to view it.
          </DialogDescription>
          <Separator />
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {report?.versions?.map((version, index) => {
              const renderStatusBadge = (status: string) => {
                const normalizedStatus = status.toUpperCase();

                switch (normalizedStatus) {
                  case "APPROVED":
                    return (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">
                        APPROVED
                      </Badge>
                    );
                  case "NEEDS_CORRECTION":
                    return (
                      <Badge variant="destructive">NEEDS CORRECTION</Badge>
                    );
                  case "SUBMITTED":
                    return <Badge variant="default">SUBMITTED</Badge>;
                  case "DRAFT":
                    return <Badge variant="secondary">DRAFT</Badge>;
                  default:
                    return <Badge variant="outline">{normalizedStatus}</Badge>;
                }
              };

              return (
                <button
                  key={version.id}
                  onClick={() => {
                    onOpenChange(false);
                    router.push(
                      `/dashboard/reports/${reportId}/versions/${version.id}`,
                    );
                  }}
                  className="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:border-primary transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">Version {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {version.submittedAt
                        ? `Submitted ${formatDateTime(version.submittedAt)}`
                        : "Not yet submitted"}
                    </p>
                  </div>

                  {renderStatusBadge(version.status)}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportVersionsDialog;
