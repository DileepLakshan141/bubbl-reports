/* eslint-disable react-hooks/set-state-in-effect */
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
import { getReport } from "@/lib/services/report";
import { Report } from "@/lib/types/report.type";

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

const TeamMemberVersionsDialog = ({
  reportId,
  open,
  onOpenChange,
}: {
  reportId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
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

  // Latest first for the manager's view
  const versions = [...(report?.versions ?? [])].reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">
            Report versions
          </DialogTitle>
          <DialogDescription>
            Most recent version first. Click one to review it.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {versions.map((version, i) => (
              <button
                key={version.id}
                onClick={() => {
                  onOpenChange(false);
                  router.push(
                    `/dashboard/reports/${reportId}/reviews/${version.id}`,
                  );
                }}
                className="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:border-primary transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    Version {versions.length - i}
                  </p>
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

export default TeamMemberVersionsDialog;
