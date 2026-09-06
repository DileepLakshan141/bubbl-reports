import { redirect } from "next/navigation";
import { getSession } from "@/lib/session/session";
import ManagerReportReview from "@/components/reports/manager-report-review/manager-report-review";

const ReviewPage = async ({
  params,
}: {
  params: Promise<{ reportId: string; versionId: string }>;
}) => {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "MANAGER" && session.role !== "ADMIN")
    redirect("/dashboard/home");

  const { reportId, versionId } = await params;
  return (
    <ManagerReportReview
      reportId={Number(reportId)}
      versionId={Number(versionId)}
    />
  );
};

export default ReviewPage;
