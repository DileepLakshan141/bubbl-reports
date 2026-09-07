// components/team-dashboard/team-dashboard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Activity,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  Briefcase,
} from "lucide-react";

import { Spinner } from "../ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  getDashboardSummary,
  getDashboardInsights,
  getRecentActivity,
} from "@/lib/services/report";
import {
  DashboardSummary,
  DashboardInsights,
  ActivityItem,
} from "@/lib/types/report.type";

// Pie chart slices using themed chart variables
const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Shadcn Chart Configurations with explicit color bindings
const trendChartConfig = {
  completedCount: {
    label: "Tasks Completed",
    color: "var(--brand-blue)",
  },
} satisfies ChartConfig;

const statusChartConfig = {
  approved: {
    label: "Approved",
    color: "var(--status-approved)",
  },
  submitted: {
    label: "Submitted",
    color: "var(--status-submitted)",
  },
  needsCorrection: {
    label: "Needs Correction",
    color: "var(--status-correction)",
  },
  draft: {
    label: "Draft",
    color: "var(--status-draft)",
  },
} satisfies ChartConfig;

const workloadChartConfig = {
  taskCount: {
    label: "Tasks",
  },
} satisfies ChartConfig;

const timeTaskChartConfig = {
  hours: {
    label: "Hours",
    color: "var(--brand-blue)",
  },
} satisfies ChartConfig;

const TeamDashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const [summaryRes, insightsRes, activityRes] = await Promise.all([
        getDashboardSummary(),
        getDashboardInsights(),
        getRecentActivity(),
      ]);

      if (cancelled) return;

      if (summaryRes.success) setSummary(summaryRes.summary);
      if (insightsRes.success) setInsights(insightsRes.insights);
      if (activityRes.success) setActivity(activityRes.activity);

      if (!summaryRes.success && !insightsRes.success) {
        setError("Failed to load the team dashboard.");
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-60 flex justify-center items-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Submitted This Week"
          value={summary?.totalSubmittedThisWeek ?? 0}
          icon={CheckCircle2}
          color="text-[var(--status-approved)]"
          bgColor="bg-[var(--status-approved-bg)]"
        />
        <SummaryCard
          label="Pending Approvals"
          value={summary?.compliance.pending ?? 0}
          icon={Clock}
          color="text-[var(--brand-blue)]"
          bgColor="bg-[var(--status-submitted-bg)]"
        />
        <SummaryCard
          label="Needs Correction"
          value={summary?.needsCorrectionCount ?? 0}
          icon={AlertTriangle}
          color="text-[var(--brand-tangerine)]"
          bgColor="bg-[var(--status-correction-bg)]"
        />
        <SummaryCard
          label="Open Blockers"
          value={summary?.openBlockersCount ?? 0}
          icon={Flame}
          color="text-[var(--brand-persimmon)]"
          bgColor="bg-[var(--status-critical-bg)]"
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Completed Trend */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Tasks Completed Trend
              </CardTitle>
              <CardDescription>Weekly velocity overview</CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={trendChartConfig}
              className="h-[260px] w-full"
            >
              <LineChart data={insights?.tasksCompletedTrend ?? []}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="completedCount"
                  stroke="var(--brand-blue)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--brand-blue)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Submission Status by Team Member */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Status by Team Member
              </CardTitle>
              <CardDescription>
                Breakdown of current report statuses
              </CardDescription>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={statusChartConfig}
              className="h-[260px] w-full"
            >
              <BarChart data={insights?.statusByMember ?? []}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="username" tickLine={false} axisLine={false} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="approved"
                  stackId="a"
                  fill="var(--status-approved)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="submitted"
                  stackId="a"
                  fill="var(--status-submitted)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="needsCorrection"
                  stackId="a"
                  fill="var(--status-correction)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="draft"
                  stackId="a"
                  fill="var(--status-draft)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Workload by Project */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Workload Distribution
              </CardTitle>
              <CardDescription>
                Task allocation across active projects
              </CardDescription>
            </div>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={workloadChartConfig}
              className="h-[260px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="projectName" />}
                />
                <Pie
                  data={insights?.workloadByProject ?? []}
                  dataKey="taskCount"
                  nameKey="projectName"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {(insights?.workloadByProject ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Time Spent by Task Type */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Time Spent by Category
              </CardTitle>
              <CardDescription>Logged hours per task type</CardDescription>
            </div>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={timeTaskChartConfig}
              className="h-[260px] w-full"
            >
              <BarChart data={insights?.timeByTaskType ?? []} layout="vertical">
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="taskType"
                  width={90}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="hours"
                  fill="var(--brand-blue)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-medium">
              Recent Activity
            </CardTitle>
            <CardDescription>
              Real-time updates on team submissions and reviews
            </CardDescription>
          </div>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No recent activity recorded.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between text-sm gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {item.actorUsername}
                    </span>
                    <ActionBadge action={item.action} />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">
                        {item.targetUsername}
                      </strong>
                      &apos;s report
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Summary Metric Cards
const SummaryCard = ({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) => (
  <Card className="shadow-sm">
    <CardContent className="p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
      </div>
      <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);

// Activity Action Badges using defined custom CSS semantic tokens
const ActionBadge = ({ action }: { action: string }) => {
  switch (action) {
    case "approved":
      return (
        <Badge
          variant="outline"
          className="text-[var(--status-approved)] bg-[var(--status-approved-bg)] border-transparent"
        >
          approved
        </Badge>
      );
    case "submitted":
      return (
        <Badge
          variant="outline"
          className="text-[var(--status-submitted)] bg-[var(--status-submitted-bg)] border-transparent"
        >
          reviewed
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="text-[var(--status-correction)] bg-[var(--status-correction-bg)] border-transparent"
        >
          requested changes on
        </Badge>
      );
  }
};

export default TeamDashboard;
