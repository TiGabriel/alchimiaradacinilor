/** Wire format of GET /api/search (shared by the route and the palette). */
export type SearchApiHit = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
  meta?: Record<string, unknown>;
};

export type SearchApiResponse = {
  query: string;
  groups: Array<{ type: string; label: string; total: number; hits: SearchApiHit[] }>;
};
