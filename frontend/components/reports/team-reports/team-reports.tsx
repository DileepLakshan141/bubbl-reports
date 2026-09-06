"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { getTeamReports } from "@/lib/services/report";
import { TeamMemberLatestReport } from "@/lib/types/report.type";
import TeamMemberVersionsDialog from "./team-member-versions-dialog";

function statusColor(status?: string) {
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

const TeamReports = ({ projectId }: { projectId: number }) => {
  const [members, setMembers] = useState<TeamMemberLatestReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReportId, setActiveReportId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTeamReports(projectId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.success) setMembers(result.members);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="w-full h-60 flex justify-center items-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-0">
      <h1 className="text-lg font-semibold mb-6">Team reports</h1>

      <div className="flex flex-col gap-2">
        {members.map(({ user, latestReport }) => (
          <button
            key={user.id}
            disabled={!latestReport}
            onClick={() => latestReport && setActiveReportId(latestReport.id)}
            className="w-full text-left rounded-lg border p-3 flex items-center gap-3 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src={`https://api.dicebear.com/10.x/avataaars/svg?seed=${user.username}`}
              alt={user.username}
              className="w-10 h-10 rounded-full shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground truncate">
                {latestReport ? latestReport.name : "No reports filed yet"}
              </p>
            </div>
            {latestReport && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor(latestReport.status)}`}
              >
                {latestReport.status.replace("_", " ")}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeReportId !== null && (
        <TeamMemberVersionsDialog
          reportId={activeReportId}
          open={activeReportId !== null}
          onOpenChange={(open) => !open && setActiveReportId(null)}
        />
      )}
    </div>
  );
};

export default TeamReports;
