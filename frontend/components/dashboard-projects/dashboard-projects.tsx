/* eslint-disable react-hooks/set-state-in-effect */
// components/dashboard-projects/dashboard-projects.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardProjectsProps, Project } from "../../lib/types/project.types";
import { ScrollArea } from "../ui/scroll-area";
import EmptyTemplate from "../empty-template/empty-template";
import { FoldersIcon } from "lucide-react";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";

import {
  findAllProjects,
  findProjectsCreatedByUser,
} from "@/lib/services/project";
import CreateProjectDialog from "../project-dialogs/create-project-dialog";
import ProjectCard from "../project-card/project-card";
import UpdateProjectDialog from "../project-dialogs/update-project-dialog";
import ArchiveProjectDialog from "../project-dialogs/archive-project-dialog";
import { useRouter } from "next/navigation";

const DashboardProjects = ({ userId, userRole }: DashboardProjectsProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [archivingProject, setArchivingProject] = useState<Project | null>(
    null,
  );

  const canSeeAll = userRole === "ADMIN";

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const result = canSeeAll
      ? await findAllProjects()
      : await findProjectsCreatedByUser(userId);

    setLoading(false);
    if (result.success) {
      setProjects(result.projects);
    }
  }, [canSeeAll, userId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="rounded-lg border w-full p-4 flex flex-col justify-start items-start">
      {/* my projects */}
      <div className="w-full flex justify-between items-start mb-1">
        <div>
          <h1 className="text:text-xl md:text-2xl font-semibold font-bubbl mx-3">
            My Projects
          </h1>
          <p className="text-xs text-muted-foreground mx-3">
            {canSeeAll
              ? "Your role can see all the projects"
              : "Your role can see the projects only you created"}
          </p>
        </div>

        <CreateProjectDialog onCreated={loadProjects} />
      </div>
      <Separator className="mt-2" />

      {loading ? (
        <div className="w-full h-60 flex justify-center items-center text-muted-foreground text-sm">
          <Spinner className="size-8" />
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
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                {...project}
                onView={() => router.push(`/dashboard/projects/${project.id}`)}
                onUpdate={() => setEditingProjectId(project.id)}
                onDelete={() => setArchivingProject(project)}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {editingProjectId !== null && (
        <UpdateProjectDialog
          projectId={editingProjectId}
          open={editingProjectId !== null}
          onOpenChange={(open) => {
            if (!open) setEditingProjectId(null);
          }}
          onUpdated={loadProjects}
        />
      )}

      {archivingProject && (
        <ArchiveProjectDialog
          projectId={archivingProject.id}
          projectName={archivingProject.name}
          open={!!archivingProject}
          onOpenChange={(open) => {
            if (!open) setArchivingProject(null);
          }}
          onArchived={loadProjects}
        />
      )}
    </div>
  );
};

export default DashboardProjects;
