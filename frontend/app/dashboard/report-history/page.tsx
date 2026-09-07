import { redirect } from "next/navigation";
import { getSession } from "@/lib/session/session";
import ReportHistory from "@/components/reports/report-history/report-history";

const ReportHistoryPage = async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  return <ReportHistory userId={session.sub} userRole={session.role} />;
};

export default ReportHistoryPage;
