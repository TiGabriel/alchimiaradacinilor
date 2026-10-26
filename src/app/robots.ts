import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or per-visitor pages (they also carry `noindex`).
        disallow: [
          "/admin",
          "/api/",
          "/cautare",
          "/cont",
          "/salvate",
          "/newsletter/",
          "/quiz/rezultat/",
          "/spre-doterra/",
          "/styleguide",
        ],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
