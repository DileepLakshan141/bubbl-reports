/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createDraft, getReportsByProject } from "@/lib/services/report";

interface CreateReportButtonProps {
  projectId: number;
  userId: number | string;
  onCreated?: () => void;
}

/**
 * Returns YYYY-MM-DD in LOCAL time without ISO/UTC shifts
 */
function formatLocalISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentWeekISOStrings() {
  const now = new Date();
  const day = now.getDay();
  // Adjust so Monday is day 0 of the week
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startStr: formatLocalISO(monday),
    endStr: formatLocalISO(sunday),
  };
}

/**
 * Normalizes date values (string/Date) into YYYY-MM-DD format
 */
function normalizeToISODate(dateVal: string | Date): string {
  if (typeof dateVal === "string") {
    // Slices "2026-09-07T00:00:00.000Z" or "2026-09-07" directly
    return dateVal.slice(0, 10);
  }
  return formatLocalISO(dateVal);
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

      const { startStr, endStr } = getCurrentWeekISOStrings();

      const myReportsThisWeek = result.reports.filter((r: any) => {
        const creatorId =
          typeof r.createdBy === "object" && r.createdBy !== null
            ? r.createdBy.id
            : (r.createdBy ?? r.authorId ?? r.userId);

        if (String(creatorId) !== String(userId)) return false;

        const reportStartStr = normalizeToISODate(r.startDate);

        const sundayBeforeMonday = new Date(startStr);
        sundayBeforeMonday.setDate(sundayBeforeMonday.getDate() - 1);
        const sundayStr = formatLocalISO(sundayBeforeMonday);

        return reportStartStr >= sundayStr && reportStartStr <= endStr;
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
