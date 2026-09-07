import { redirect } from "next/navigation";
import { getSession } from "@/lib/session/session";
import DashboardHome from "@/components/dashboard-home/dashboard-home";
import TeamDashboard from "@/components/team-dashboard/team-dashboard";

const HomePage = async () => {
  const session = await getSession();
  if (!session) redirect("/login");

  return session.role === "TEAM_MEMBER" ? (
    <DashboardHome userId={session.sub} />
  ) : (
    <TeamDashboard />
  );
};

export default HomePage;
