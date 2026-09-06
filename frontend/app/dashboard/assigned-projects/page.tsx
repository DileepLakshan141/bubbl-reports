import { redirect } from "next/navigation";
import { getSession } from "../../../lib/session/session";
import DashboardAssignedProjects from "../../../components/dashboard-assigned-projects/dashboard-assigned-projects";

const AssignedProjects = async () => {
  const session = await getSession();
  if (!session) redirect("/login");

  return <DashboardAssignedProjects userId={session.sub} />;
};

export default AssignedProjects;
