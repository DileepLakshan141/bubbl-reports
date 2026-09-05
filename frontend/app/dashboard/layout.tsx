import { AppSidebar } from "@/components/sidebar/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import UserInfo from "../../components/user-info/user-info";
import { getSession } from "../../lib/session/session";
import { redirect } from "next/navigation";

export default async function Page({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/no-access");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex w-full h-16 shrink-0 items-center">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />

            <Separator orientation="vertical" className="h-12" />

            <div className="ml-auto">
              <UserInfo />
            </div>
          </div>
        </header>
        <Separator />
        <div className="flex h-full w-full p-3">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
