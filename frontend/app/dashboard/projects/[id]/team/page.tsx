import { redirect } from "next/navigation";
import { getSession } from "../../../../../lib/session/session";
import TeamReports from "../../../../../components/reports/team-reports/team-reports";

const TeamPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "MANAGER" && session.role !== "ADMIN")
    redirect("/dashboard/home");

  const { id } = await params;
  return <TeamReports projectId={Number(id)} />;
};

export default TeamPage;
