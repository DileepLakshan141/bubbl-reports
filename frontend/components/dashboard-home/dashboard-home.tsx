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
import {
  DashboardHomeProps,
  ProjectAssignments,
} from "@/lib/types/project.types";
import { Spinner } from "../ui/spinner";
import ProjectCardReadOnly from "../project-card/project-card-read-only";

const DashboardHome = ({ userId }: DashboardHomeProps) => {
  const email = useAppSelector((state) => state.auth.user?.email);

  const [projects, setProjects] = useState<ProjectAssignments[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    findAssignedProjects().then((result) => {
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
        Assigned Projects
      </h1>
      <Separator />
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
            {projects.map((item) => (
              <ProjectCardReadOnly project={item.project} key={item.id} />
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
