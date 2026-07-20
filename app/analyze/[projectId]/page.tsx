import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectForUser } from "@/services/projectService";
import { DesignStudio } from "@/components/design/DesignStudio";

interface PageProps {
  params: { projectId: string };
}

/**
 * STEP 4(공간 유형 선택) + STEP 5(AI 인테리어 이미지 생성) 통합 화면.
 */
export default async function AnalyzePage({ params }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const project = await getProjectForUser(params.projectId, user.id);
  if (!project) redirect("/upload");

  return (
    <div className="container-px mx-auto max-w-4xl py-10">
      <DesignStudio projectId={project.id} photos={project.photos} />
    </div>
  );
}
