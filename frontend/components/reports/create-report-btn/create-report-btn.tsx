"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createDraft, getReportsByProject } from "../../../lib/services/report";

interface CreateReportButtonProps {
  projectId: number;
  userId: number; // needed to scope the "already filed this week" check to the caller
  onCreated?: () => void;
}

function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const CreateReportButton = ({
  projectId,
  userId,
  onCreated,
}: CreateReportButtonProps) => {
  const router = useRouter();
  const [dueThisWeek, setDueThisWeek] = useState(false);
  const [checking, setChecking] = useState(true);
  const [creating, setCreating] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getReportsByProject(projectId).then((result) => {
      if (cancelled) return;
      setChecking(false);

      if (!result.success) {
        setFetchError(result.message);
        return;
      }

      const { start, end } = getCurrentWeekRange();

      // Only look at THIS user's own reports for this project — someone
      // else on the team filing theirs must not disable my button.
      const myReportsThisWeek = result.reports.filter((r) => {
        if (r.createdBy !== userId) return false;
        const reportStart = new Date(r.startDate);
        return reportStart >= start && reportStart <= end;
      });

      setDueThisWeek(myReportsThisWeek.length === 0);
    });

    return () => {
      cancelled = true;
    };
  }, [projectId, userId]);

  const handleCreate = async () => {
    setCreating(true);
    const result = await createDraft({ projectId });
    setCreating(false);

    if (result.success) {
      onCreated?.();
      router.push(`/dashboard/reports/${result.report.id}/edit`);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleCreate}
        disabled={!dueThisWeek || checking || creating}
      >
        {checking ? "Checking..." : creating ? "Creating..." : "Create report"}
      </Button>
      {fetchError && <p className="text-xs text-destructive">{fetchError}</p>}
    </div>
  );
};

export default CreateReportButton;
