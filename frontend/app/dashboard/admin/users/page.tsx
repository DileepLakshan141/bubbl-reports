import { redirect } from "next/navigation";
import { getSession } from "@/lib/session/session";
import UserManagement from "@/components/admin/user-management/user-management";

const AdminUsersPage = async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard/home");
  return <UserManagement />;
};

export default AdminUsersPage;
