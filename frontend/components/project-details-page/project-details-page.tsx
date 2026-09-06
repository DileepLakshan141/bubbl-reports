"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { findProjectById } from "@/lib/services/project";
import { getReportsByProject } from "@/lib/services/report";
import { Project } from "@/lib/types/project.types";
import { ReportListItem } from "../../lib/types/report.type";
import CreateReportButton from "../reports/create-report-btn/create-report-btn";
import ReportListRow from "../reports/report-list-rows/report-list-rows";

interface ProjectDetailProps {
  projectId: number;
  userId: number;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

const ProjectDetail = ({ projectId, userId }: ProjectDetailProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    const result = await getReportsByProject(projectId);
    if (result.success) setReports(result.reports);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [projectResult] = await Promise.all([
        findProjectById(projectId),
        loadReports(),
      ]);
      if (cancelled) return;
      if (projectResult.success) setProject(projectResult.project);
      setLoading(false);
    })();

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

  if (!project) {
    return (
      <p className="text-center text-muted-foreground py-10">
        Project not found.
      </p>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full h-70 overflow-hidden rounded-t-lg mb-6">
        <img
          src={`https://api.dicebear.com/10.x/triangles/svg?seed=${project.id}`}
          alt="project-banner"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-1">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-md text-muted-foreground mt-2 leading-relaxed">
          {project.description}
        </p>
        <p className="text-sm font-semibold text-muted-foreground mt-3">
          Created by {project.creator?.username ?? "Unknown"} on{" "}
          {formatDate(project.createdAt)}
        </p>
      </div>

      <Separator className="my-6" />

      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-base font-semibold">Reports</h2>
        <CreateReportButton
          userId={userId}
          projectId={projectId}
          onCreated={loadReports}
        />
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">
          No reports filed yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((report) => (
            <ReportListRow key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
