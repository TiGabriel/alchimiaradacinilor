import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QuizFlow } from "@/features/quiz/quiz-flow";
import { getQuizView } from "@/services/quiz/quiz";

export const metadata: Metadata = {
  title: "Quiz aromatic",
  description:
    "Câteva întrebări despre preferințele tale și îți recomandăm de unde să începi — cu explicații pentru fiecare alegere.",
  alternates: { canonical: "/quiz" },
};

export default async function QuizPage() {
  const quiz = await getQuizView();
  if (!quiz) {
    return (
      <div className="container-page">
        <EmptyState
          size="lg"
          headingLevel="h1"
          title="Quiz-ul este în pregătire"
          description="Până atunci, poți descoperi produsele după nevoie."
          actions={
            <Button asChild>
              <Link href="/descopera">Descoperă după nevoie</Link>
            </Button>
          }
        />
      </div>
    );
  }
  return <QuizFlow quiz={quiz} />;
}
