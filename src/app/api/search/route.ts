import { NextResponse, type NextRequest } from "next/server";

import { clientIp } from "@/lib/request";
import { limiters } from "@/services/auth/rate-limit";
import { getCategoryTree } from "@/services/catalog/categories";
import { categoryHref } from "@/services/catalog/category-tree";
import { searchSite } from "@/services/search";
import type { SearchApiResponse } from "@/services/search/api-types";
import { searchQuerySchema } from "@/validation/search";

/** Instant suggestions for the search palette. An empty query returns browse suggestions. */
export async function GET(request: NextRequest) {
  const limit_ = limiters.searchByIp.check(clientIp(request.headers) ?? "unknown");
  if (!limit_.allowed)
    return NextResponse.json(
      { error: "Prea multe căutări într-un timp scurt. Încearcă din nou peste câteva secunde." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit_.retryAfterMs / 1000)) } },
    );
  const { q, limit } = searchQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  let body: SearchApiResponse;
  if (!q) {
    const tree = await getCategoryTree();
    body = {
      query: "",
      groups: [
        {
          type: "category",
          label: "Explorează categoriile",
          total: tree.length,
          hits: tree.map((c) => ({
            id: c.id,
            type: "category",
            title: c.name,
            href: categoryHref(c),
          })),
        },
      ],
    };
  } else {
    const groups = await searchSite(q, limit);
    body = {
      query: q,
      groups: groups.map((g) => ({
        type: g.type,
        label: g.label,
        total: g.total,
        hits: g.hits.map(({ doc }) => ({
          id: doc.id,
          type: doc.type,
          title: doc.title,
          subtitle: doc.subtitle,
          href: doc.href,
          meta: doc.meta,
        })),
      })),
    };
  }

  return NextResponse.json(body, { headers: { "Cache-Control": "private, max-age=30" } });
}
