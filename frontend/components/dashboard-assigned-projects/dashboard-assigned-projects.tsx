/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FoldersIcon } from "lucide-react";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";
import EmptyTemplate from "../empty-template/empty-template";
import ProjectCardReadOnly from "../project-card/project-card-read-only";
import { findAssignedProjects } from "@/lib/services/project";
import {
  DashboardAssignedProjectsProps,
  ProjectAssignment,
} from "@/lib/types/project.types";

const DashboardAssignedProjects = ({
  userId,
}: DashboardAssignedProjectsProps) => {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (signal: { cancelled: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await findAssignedProjects();
      if (signal.cancelled) return;

      if (result.success) {
        setProjects(result.projects);
      } else {
        setError(result.message ?? "Failed to load your assigned projects.");
      }
    } catch {
      if (!signal.cancelled) {
        setError("Something went wrong while loading your projects.");
      }
    } finally {
      if (!signal.cancelled) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchProjects(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchProjects, userId]);

  return (
    <div className="rounded-lg border w-full p-4 flex flex-col justify-start items-start">
      <div className="w-full flex justify-between items-start mb-1">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold font-bubbl mx-3">
            Assigned Projects
          </h1>
          <p className="text-xs text-muted-foreground mx-3">
            Projects you have been assigned to
          </p>
        </div>
      </div>
      <Separator className="mt-2" />

      {loading ? (
        <div className="w-full h-60 flex justify-center items-center text-muted-foreground text-sm">
          <Spinner className="size-8" />
        </div>
      ) : error ? (
        <div className="w-full h-60 flex flex-col gap-3 justify-center items-center text-muted-foreground text-sm">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProjects({ cancelled: false })}
          >
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="w-full h-60 flex justify-start items-center">
          <EmptyTemplate
            icon={FoldersIcon}
            title="No projects found!"
            description="Looks like you have not been added to a project yet! Please check again later."
            tailwindHeight="h-5"
          />
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap rounded-md mt-2 mb-6">
          <div className="flex gap-4 pb-4">
            {projects.map((item) => (
              <ProjectCardReadOnly
                key={item.id}
                project={item.project}
                onView={() =>
                  router.push(`/dashboard/projects/${item.project.id}`)
                }
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
};

export default DashboardAssignedProjects;
