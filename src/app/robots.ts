import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, transactional or per-visitor pages (they also carry `noindex`).
        disallow: [
          "/admin",
          "/api/",
          "/cautare",
          "/cont",
          "/cos",
          "/favorite",
          "/finalizare-comanda",
          "/newsletter/",
          "/quiz/rezultat/",
          "/styleguide",
        ],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
