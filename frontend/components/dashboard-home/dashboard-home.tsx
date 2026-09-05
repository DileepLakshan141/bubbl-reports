// components/dashboard-home/dashboard-home.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "../../store/hooks";
import { Separator } from "../ui/separator";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import EmptyTemplate from "../empty-template/empty-template";
import { FileIcon, FoldersIcon } from "lucide-react";
import { findAssignedProjects } from "@/lib/services/project";
import { DashboardHomeProps, Project } from "@/lib/types/project.types";

const DashboardHome = ({ userId }: DashboardHomeProps) => {
  const email = useAppSelector((state) => state.auth.user?.email);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    findAssignedProjects(userId).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setProjects(result.projects);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="rounded-lg border w-full p-4 flex flex-col justify-start items-start">
      {/* welcome banner */}
      <div className="relative p-4 mb-5 text-white w-full h-50 rounded-lg bg-gradient-to-tl from-zinc-900 via-blue-900 to-zinc-900 flex flex-col">
        <h1 className="text-3xl mt-4">Welcome {email}!</h1>
        <p className="text-md mt-4 max-w-160">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vitae omnis
          ipsa natus nemo tempora eos cumque reiciendis sapiente quidem fuga!
        </p>
        <Image
          src="/welcome-banner.png"
          width={280}
          height={80}
          alt="welcome-placeholder"
          className="hidden md:block absolute bottom-0 right-10"
        />
      </div>

      {/* my projects */}
      <h1 className="text:text-xl md:text-2xl font-semibold font-bubbl mb-2 mx-3">
        My Projects
      </h1>
      <Separator />
      {loading ? (
        <div className="w-full h-60 flex justify-center items-center text-muted-foreground text-sm">
          Loading projects...
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
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="shrink-0 w-64 rounded-lg border p-4 hover:border-primary transition-colors"
              >
                <h3 className="font-semibold truncate">{project.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {project.description}
                </p>
                <span
                  className={`inline-block mt-3 text-xs px-2 py-0.5 rounded-full ${
                    project.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {project.isActive ? "Active" : "Archived"}
                </span>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* my reports */}
      <h1 className="text:text-xl md:text-2xl font-semibold font-bubbl mb-2 mx-3">
        My Reports
      </h1>
      <Separator />
      <div className="w-full h-60 flex justify-start items-center">
        <EmptyTemplate
          icon={FileIcon}
          title="No Reports found!"
          description="Looks like you have not create any report yet! Please check after you create some."
          tailwindHeight="h-5"
        />
      </div>
    </div>
  );
};

export default DashboardHome;
