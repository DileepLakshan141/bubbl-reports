"use client";

import { useEffect, useState, useMemo } from "react";
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { findProjectById } from "@/lib/services/project";
import { getReportsByProject } from "@/lib/services/report";
import { Project } from "@/lib/types/project.types";
import { ReportListItem } from "../../lib/types/report.type";
import CreateReportButton from "../reports/create-report-btn/create-report-btn";
import ReportListRow from "../reports/report-list-rows/report-list-rows";
import { useAppSelector } from "../../store/hooks";

interface ProjectDetailProps {
  projectId: number;
  userId: number;
}

function formatDate(dateString: string) {
  const cleanDate = dateString.slice(0, 10);
  return format(parseISO(cleanDate), "PPP");
}

const ProjectDetail = ({ projectId, userId }: ProjectDetailProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const userRole = useAppSelector((state) => state.auth.user?.role);

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

  const filteredReports = useMemo(() => {
    if (!dateRange?.from) return reports;

    const filterFrom = startOfDay(dateRange.from);
    const filterTo = dateRange.to
      ? endOfDay(dateRange.to)
      : endOfDay(dateRange.from);

    return reports.filter((report) => {
      const reportStart = parseISO(report.startDate.slice(0, 10));
      const reportEnd = parseISO(report.endDate.slice(0, 10));

      const startInRange = isWithinInterval(reportStart, {
        start: filterFrom,
        end: filterTo,
      });
      const endInRange = isWithinInterval(reportEnd, {
        start: filterFrom,
        end: filterTo,
      });
      const spansRange = reportStart <= filterFrom && reportEnd >= filterTo;

      return startInRange || endInRange || spansRange;
    });
  }, [reports, dateRange]);

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
      <div className="w-full h-20 overflow-hidden rounded-t-lg mb-6">
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Reports</h2>

          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger>
                <div
                  id="date"
                  className={`border px-4 py-2 flex justify-center items-center text-left font-normal ${
                    !dateRange ? "text-muted-foreground" : ""
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, yyyy")} -{" "}
                        {format(dateRange.to, "LLL dd, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, yyyy")
                    )
                  ) : (
                    <span>Filter by date range</span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {dateRange && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDateRange(undefined)}
                title="Clear date filter"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {userRole === "TEAM_MEMBER" && (
          <CreateReportButton
            userId={userId}
            projectId={projectId}
            onCreated={loadReports}
          />
        )}
      </div>

      {/* Reports List View */}
      {filteredReports.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1 py-4">
          {reports.length === 0
            ? "No reports filed yet."
            : "No reports found for the selected date range."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredReports.map((report) => (
            <ReportListRow
              key={report.id}
              report={report}
              currentUserId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
