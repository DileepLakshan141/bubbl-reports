"use client";

import { useEffect, useState, use } from "react";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Report } from "@/lib/types/report.type";
import { getReport } from "../../../../../../lib/services/report";

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
        <Spinner className="size-8" />
      </div>
    );
  }

  const version = report?.versions?.find((v) => v.id === Number(versionId));

  if (!version) {
    return (
      <p className="text-center text-muted-foreground py-10">
        Version not found.
      </p>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-1">
        <h1 className="text-lg font-semibold">{report?.name}</h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
          {version.status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Read-only — this is a past version
      </p>

      <Separator className="mb-6" />

      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3">Tasks</h2>
        <div className="flex flex-col gap-2">
          {version.tasks.map((task, i) => (
            <div key={i} className="rounded-lg border p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{task.name}</span>
                <span className="text-xs text-muted-foreground">
                  {task.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Planned {task.plannedProgress}% · Actual {task.actualProgress}%
                · {task.timeSpent}h / {task.timePlanned}h
              </p>
            </div>
          ))}
        </div>
      </section>

      {version.blockers.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3">Blockers</h2>
          <ul className="list-disc list-inside text-sm space-y-1">
            {version.blockers.map((b, i) => (
              <li key={i}>
                {b.name}
                {b.isKeyIssue && " (key issue)"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {version.achievements.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3">Achievements</h2>
          <ul className="list-disc list-inside text-sm space-y-1">
            {version.achievements.map((a, i) => (
              <li key={i}>
                {a.name}
                {a.isKeyAchievement && " (key achievement)"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {version.comments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3">Review comments</h2>
          <div className="flex flex-col gap-2">
            {version.comments.map((c, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <span className="text-xs font-medium">{c.action}</span>
                <p className="text-sm mt-1">{c.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ReadOnlyVersionPage;
