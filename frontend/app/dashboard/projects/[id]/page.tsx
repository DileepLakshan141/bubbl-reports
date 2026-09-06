import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/session/session";
import ProjectDetail from "../../../../components/project-details-page/project-details-page";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

const ProjectDetailPage = async ({ params }: ProjectDetailPageProps) => {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    redirect("/dashboard/home");
  }

  return <ProjectDetail userId={session.sub} projectId={projectId} />;
};

export default ProjectDetailPage;
