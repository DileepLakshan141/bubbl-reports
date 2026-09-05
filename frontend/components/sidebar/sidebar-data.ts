import {
  LayoutDashboard,
  ClipboardList,
  History,
  Users,
  ListTodo,
  FolderBookmark,
  UserCog,
  Settings,
  Bell,
  BarChart3,
  LogOut,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type SidebarGroupData = {
  label: string;
  items: NavItem[];
};

export const sidebarData: SidebarGroupData[] = [
  {
    label: "OVERVIEW",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "PROJECTS",
    items: [
      {
        title: "My Projects",
        url: "/dashboard/projects",
        icon: FolderBookmark,
      },
    ],
  },
  {
    label: "REPORTS",
    items: [
      {
        title: "My Weekly Report",
        url: "/dashboard/report",
        icon: ClipboardList,
      },
      {
        title: "Report History",
        url: "/dashboard/report-history",
        icon: History,
      },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
      {
        title: "User Management",
        url: "/dashboard/users",
        icon: UserCog,
      },
    ],
  },
];

export const sidebarLogoutIcon = LogOut;
