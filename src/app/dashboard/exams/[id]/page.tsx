import { ExamRunner } from "@/components/exam-runner";
import { requireUser } from "@/server/auth/guards";

type PageContext = { params: Promise<{ id: string }> };

export default async function ExamPage({ params }: PageContext) {
  const { id } = await params;
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") await requireUser();
  return <ExamRunner examId={id} />;
}
