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
          <DialogTitle>Report versions</DialogTitle>
          <DialogDescription>
            Every version of this report, oldest first. Click one to view it.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {report?.versions?.map((version, index) => (
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
                <span className="text-xs text-muted-foreground">
                  {version.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportVersionsDialog;
