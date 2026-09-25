import type { Metadata } from "next";

import { QuizEditor } from "@/features/admin/quiz/quiz-editor";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getQuizEditor } from "@/services/admin/quiz";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizAdminPage() {
  const { user } = await requirePermission("content:edit");
  const { quiz, options } = await getQuizEditor({ id: user.id, roles: user.roles });
  const questions = (quiz?.questions ?? []).map((q) => ({
    id: q.id,
    text: q.text,
    helpText: q.helpText,
    type: q.type,
    required: q.required,
    position: q.position,
    answers: q.answers.map((a) => ({
      id: a.id,
      text: a.text,
      position: a.position,
      maxPrice: a.maxPrice,
      uses: a.uses,
      needs: a.needs.map((n) => ({ id: n.needId, weight: n.weight })),
      aromas: a.aromaProfiles.map((n) => ({ id: n.aromaProfileId, weight: n.weight })),
      tags: a.tags.map((n) => ({ id: n.tagId, weight: n.weight })),
      productTypes: a.productTypes.map((p) => ({ type: p.productType, weight: p.weight })),
    })),
  }));
  return (
    <>
      <AdminPageHeader
        title="Quiz aromatic"
        description={`${questions.length} întrebări · ${quiz?._count.results ?? 0} rezultate salvate. Multiplicatorii globali sunt în Setări › Recomandări.`}
      />
      <QuizEditor questions={questions} options={options} />
    </>
  );
}
