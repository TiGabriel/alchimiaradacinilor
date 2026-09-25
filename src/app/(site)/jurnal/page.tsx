import type { Metadata } from "next";

import { JournalListing } from "@/features/journal/journal-listing";
import { getArticleCategories, listArticles } from "@/services/journal/journal";

export const metadata: Metadata = {
  title: "Jurnal",
  description:
    "Povești despre plante și arome, ghiduri pentru început și idei de ritualuri simple.",
  alternates: { canonical: "/jurnal" },
};

export default async function JournalPage(props: PageProps<"/jurnal">) {
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const [articles, categories] = await Promise.all([
    listArticles({ query }),
    getArticleCategories(),
  ]);
  return (
    <JournalListing
      eyebrow="Jurnal"
      title="Jurnalul botanic"
      description="Povești despre plante și arome, ghiduri pentru început și idei de ritualuri simple."
      articles={articles}
      categories={categories}
      query={query || undefined}
      searchAction="/jurnal"
    />
  );
}
