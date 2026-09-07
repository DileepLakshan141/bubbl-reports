import {
  LayoutDashboard,
  FolderBookmark,
  UserCog,
  LogOut,
  MessageCircleDashedCheck,
} from "lucide-react";
import { SidebarGroupData } from "../../lib/types/auth.types";

export const sidebarData: SidebarGroupData[] = [
  {
    label: "OVERVIEW",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/home",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "PROJECTS & REPORTS",
    items: [
      {
        title: "My Projects",
        url: "/dashboard/projects",
        icon: FolderBookmark,
        roles: ["MANAGER", "ADMIN"],
      },
      {
        title: "Assigned Projects",
        url: "/dashboard/assigned-projects",
        icon: MessageCircleDashedCheck,
        roles: ["TEAM_MEMBER"],
      },
    ],
  },
  {
    label: "MANAGEMENT",
    roles: ["ADMIN"],
    items: [
      {
        title: "User Management",
        url: "/dashboard/admin/users",
        icon: UserCog,
        roles: ["ADMIN"],
      },
    ],
  },
];

export const sidebarLogoutIcon = LogOut;
