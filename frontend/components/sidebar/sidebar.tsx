"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function AppSidebar() {
  const pathname = usePathname();

  function handleLogout() {
    console.log("Logout clicked");
  }

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
          <div className="flex flex-col">
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

            <SidebarGroupLabel
              className="
                mb-2
                px-3
                text-[10px]
                font-semibold
                tracking-[0.16em]
                text-blue-200/50
              "
            >
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
                        className={`
                          group
                          relative
                          h-11
                          overflow-hidden
                          rounded-xl
                          border
                          transition-all
                          duration-300

                          ${
                            isActive
                              ? `
                                border-white/15
                                bg-white/15
                                text-white
                                shadow-lg
                                shadow-black/10
                                backdrop-blur-xl
                              `
                              : `
                                border-transparent
                                bg-white/[0.025]
                                text-blue-100/70
                                hover:border-white/10
                                hover:bg-white/[0.08]
                                hover:text-white
                                hover:backdrop-blur-md
                              `
                          }
                        `}
                      >
                        <Link
                          href={item.url}
                          className="
                            flex
                            w-full
                            items-center
                            gap-3
                            px-3
                          "
                        >
                          {/* Active Glow */}

                          {isActive && (
                            <span
                              className="
                                absolute
                                left-0
                                top-1/2
                                h-6
                                w-1
                                -translate-y-1/2
                                rounded-r-full
                                bg-[#035AA6]
                                shadow-lg
                                shadow-[#035AA6]
                              "
                            />
                          )}

                          {/* Icon */}

                          <div
                            className={`
                              flex
                              size-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              transition-all
                              duration-300

                              ${
                                isActive
                                  ? `
                                    bg-[#035AA6]
                                    text-white
                                    shadow-md
                                    shadow-[#035AA6]/40
                                  `
                                  : `
                                    text-blue-200/70
                                    group-hover:bg-white/10
                                    group-hover:text-white
                                  `
                              }
                            `}
                          >
                            <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                          </div>

                          {/* Title */}

                          <span
                            className="
                              flex-1
                              text-sm
                              font-medium
                            "
                          >
                            {item.title}
                          </span>

                          {/* Active Arrow */}

                          {isActive && (
                            <ChevronRight
                              size={16}
                              className="
                                text-blue-200
                                transition-transform
                                duration-300
                                group-hover:translate-x-1
                              "
                            />
                          )}
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
                <LogOut
                  size={18}
                  className="
                    transition-transform
                    duration-300
                    group-hover:-translate-x-0.5
                  "
                />
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
