"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";

import { sidebarData, type NavItem } from "./sidebar-data";
import { logoutUser } from "../../lib/services/logout";
import { useAppDispatch } from "../../store/hooks";
import { clearUser } from "../../store/authSlice";
import { toast } from "sonner";

export function AppSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch(clearUser());
      toast.success("Logged out successfully!");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("An error occurred during logout.");
    }
  };

  function isActiveRoute(item: NavItem) {
    if (item.url === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === item.url || pathname.startsWith(`${item.url}/`);
  }

  return (
    <Sidebar
      className="
        border-r
        border-white/10
        bg-[#021F59]
        text-white
      "
    >
      <SidebarHeader className="px-4 pt-5 pb-4">
        <Link
          href="/dashboard"
          className="
            group
            flex
            items-center
            gap-3
            rounded-2xl
            px-3
            py-3
            transition-all
            duration-300
            hover:bg-white/5
          "
        >
          <div className="w-full flex flex-col justify-center items-center">
            <h1
              className="
                font-bubbl
                text-3xl
                leading-none
                tracking-tight
                text-white
              "
            >
              bubbl
            </h1>

            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-blue-200/60">
              Team Workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <Separator className="bg-white/10" />

      <SidebarContent className="px-3 py-5">
        {sidebarData.map((group) => (
          <SidebarGroup key={group.label} className="mb-3 px-0">
            {/* Group Label */}

            <SidebarGroupLabel className="text-xs font-semibold">
              {group.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) => {
                  const isActive = isActiveRoute(item);

                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        className="py-5 px-2"
                      >
                        <Link href={item.url}>
                          <div className="flex w-full h-auto items-center gap-2">
                            {/* Icon */}
                            <div className="ml-2">
                              <Icon className="text-lg" />
                            </div>
                            {/* Title */}
                            <span className="text-md font-bubbl">
                              {item.title}
                            </span>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Separator className="mb-4 bg-white/10" />

        {/* Logout */}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="
                group
                h-12
                rounded-xl
                border
                border-[#F25C05]/20
                bg-[#F25C05]/5
                text-orange-100
                transition-all
                duration-300

                hover:border-[#F25C05]/50
                hover:bg-[#F25C05]
                hover:text-white
                hover:shadow-lg
                hover:shadow-[#F25C05]/25
              "
            >
              <div
                className="
                  flex
                  size-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#F25C05]/15
                  text-[#F28705]
                  transition-all
                  duration-300
                  group-hover:bg-white/15
                  group-hover:text-white
                "
              >
                <LogOut size={18} />
              </div>

              <span className="flex-1 text-left font-semibold">Sign Out</span>

              <ChevronRight
                size={16}
                className="
                  opacity-40
                  transition-all
                  duration-300
                  group-hover:translate-x-1
                  group-hover:opacity-100
                "
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
