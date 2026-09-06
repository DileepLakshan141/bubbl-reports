"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportListItem } from "../../../lib/types/report.type";
import ReportVersionsDialog from "../report-version-dialog/report-version-dialog";

function statusColor(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "SUBMITTED":
      return "bg-blue-100 text-blue-800";
    case "NEEDS_CORRECTION":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

const ReportListRow = ({ report }: { report: ReportListItem }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isEditable =
    report.status === "DRAFT" || report.status === "NEEDS_CORRECTION";

  const handleClick = () => {
    if (isEditable) {
      router.push(`/dashboard/reports/${report.id}/edit`);
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:border-primary transition-colors"
      >
        <div>
          <p className="text-sm font-medium">{report.name}</p>
          <p className="text-xs text-muted-foreground">
            Filed by {report.creator.username}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${statusColor(report.status)}`}
        >
          {report.status.replace("_", " ")}
        </span>
      </button>

      {!isEditable && (
        <ReportVersionsDialog
          reportId={report.id}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
};

export default ReportListRow;
