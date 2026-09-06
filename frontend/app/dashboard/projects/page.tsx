import { redirect } from "next/navigation";
import { getSession } from "../../../lib/session/session";
import DashboardProjects from "../../../components/dashboard-projects/dashboard-projects";

const MyProjectsPage = async () => {
  const session = await getSession();
  if (!session || !["ADMIN", "MANAGER"].includes(session.role))
    redirect("/no-access");

  return <DashboardProjects userId={session.sub} userRole={session.role} />;
};

export default MyProjectsPage;
