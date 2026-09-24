import { StudentDashboard } from "@/components/student-dashboard";
import { requireUser } from "@/server/auth/guards";

export default async function DashboardPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") await requireUser();
  return <StudentDashboard />;
}
