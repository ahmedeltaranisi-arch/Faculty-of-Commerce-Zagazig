import { AdminDashboard } from "@/components/admin-dashboard";
import { requirePermission } from "@/server/auth/guards";

export default async function AdminPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") await requirePermission("roles.manage");
  return <AdminDashboard />;
}
