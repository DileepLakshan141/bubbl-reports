import { redirect } from "next/navigation";
import { getSession } from "../../../lib/session/session";
import DashboardHome from "../../../components/dashboard-home/dashboard-home";

const HomePage = async () => {
  const session = await getSession();
  if (!session) redirect("/login");

  return <DashboardHome userId={session.sub} />;
};

export default HomePage;
