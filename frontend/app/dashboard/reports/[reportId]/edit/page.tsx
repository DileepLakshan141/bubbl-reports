import { redirect } from "next/navigation";
import { getSession } from "../../../../../lib/session/session";
import ReportEditor from "../../../../../components/reports/report-editor/reporteditor";

interface ReportEditPageProps {
  params: Promise<{ reportId: string }>;
}

const ReportEditPage = async ({ params }: ReportEditPageProps) => {
  const session = await getSession();
  if (!session) redirect("/login");

  const { reportId } = await params;

  const castedReportId = Number(reportId);
  if (!Number.isFinite(castedReportId)) redirect("/dashboard/home");

  return <ReportEditor reportId={castedReportId} />;
};

export default ReportEditPage;
