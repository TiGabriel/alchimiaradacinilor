import { bucharestDay } from "@/lib/dates";

import { EMPTY_SEO, seoDraftFrom } from "../seo-draft";

import type { ArticleDraft } from "./article-form";
import type { RoutineDraft } from "./routine-form";

export const emptyRoutine = (): RoutineDraft => ({
  title: "",
  slug: "",
  summary: "",
  description: "",
  timeOfDay: "EVENING",
  difficulty: "BEGINNER",
  durationMinutes: "",
  frequency: "",
  featured: false,
  active: true,
  cover: null,
  needIds: [],
  tagIds: [],
  products: [],
  steps: [{ title: "", instructions: "", durationMinutes: "", productId: "" }],
  seo: EMPTY_SEO,
});

type LoadedRoutine = {
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  timeOfDay: RoutineDraft["timeOfDay"];
  difficulty: RoutineDraft["difficulty"];
  durationMinutes: number | null;
  frequency: string | null;
  featured: boolean;
  active: boolean;
  imageId: string | null;
  image: { url: string } | null;
  needs: Array<{ needId: string }>;
  tags: Array<{ tagId: string }>;
  products: Array<{ productId: string; isOptional: boolean; note: string | null }>;
  steps: Array<{
    title: string;
    instructions: string;
    durationMinutes: number | null;
    productId: string | null;
  }>;
  seo: Parameters<typeof seoDraftFrom>[0];
};

export function routineToDraft(r: LoadedRoutine): RoutineDraft {
  return {
    title: r.title,
    slug: r.slug,
    summary: r.summary,
    description: r.description ?? "",
    timeOfDay: r.timeOfDay,
    difficulty: r.difficulty,
    durationMinutes: r.durationMinutes == null ? "" : String(r.durationMinutes),
    frequency: r.frequency ?? "",
    featured: r.featured,
    active: r.active,
    cover: r.imageId && r.image ? { id: r.imageId, url: r.image.url } : null,
    needIds: r.needs.map((n) => n.needId),
    tagIds: r.tags.map((t) => t.tagId),
    products: r.products.map((p) => ({
      id: p.productId,
      isOptional: p.isOptional,
      note: p.note ?? "",
    })),
    steps: r.steps.map((s) => ({
      title: s.title,
      instructions: s.instructions,
      durationMinutes: s.durationMinutes == null ? "" : String(s.durationMinutes),
      productId: s.productId ?? "",
    })),
    seo: seoDraftFrom(r.seo),
  };
}

export const emptyArticle = (): ArticleDraft => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  authorName: "",
  categoryId: "",
  status: "DRAFT",
  publishedOn: "",
  featured: false,
  cover: null,
  productIds: [],
  routineIds: [],
  tagIds: [],
  seo: EMPTY_SEO,
});

type LoadedArticle = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  authorName: string | null;
  categoryId: string | null;
  status: ArticleDraft["status"];
  publishedAt: Date | null;
  featured: boolean;
  coverImageId: string | null;
  coverImage: { url: string } | null;
  products: Array<{ productId: string }>;
  routines: Array<{ routineId: string }>;
  tags: Array<{ tagId: string }>;
  seo: Parameters<typeof seoDraftFrom>[0];
};

export function articleToDraft(a: LoadedArticle): ArticleDraft {
  return {
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt ?? "",
    content: a.content,
    authorName: a.authorName ?? "",
    categoryId: a.categoryId ?? "",
    status: a.status,
    publishedOn: a.publishedAt ? bucharestDay(a.publishedAt) : "",
    featured: a.featured,
    cover: a.coverImageId && a.coverImage ? { id: a.coverImageId, url: a.coverImage.url } : null,
    productIds: a.products.map((p) => p.productId),
    routineIds: a.routines.map((r) => r.routineId),
    tagIds: a.tags.map((t) => t.tagId),
    seo: seoDraftFrom(a.seo),
  };
}
