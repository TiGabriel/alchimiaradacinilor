/** Pure category-tree helpers (no I/O). */

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Active products in this category and its descendants. */
  productCount: number;
  children: CategoryNode[];
};

type FlatCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  position: number;
  productCount: number;
};

/** Builds a tree from flat rows; counts roll up from children to parents. Pure (tested). */
export function buildCategoryTree(rows: FlatCategory[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode & { parentId: string | null; position: number }>();
  for (const row of rows) nodes.set(row.id, { ...row, children: [] });

  const roots: Array<CategoryNode & { position: number }> = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else if (!node.parentId) roots.push(node);
  }

  const finalize = (node: CategoryNode & { position?: number }): CategoryNode => {
    const children = [...node.children]
      .sort(
        (a, b) =>
          ((a as { position?: number }).position ?? 0) -
          ((b as { position?: number }).position ?? 0),
      )
      .map(finalize);
    const total = node.productCount + children.reduce((sum, c) => sum + c.productCount, 0);
    return {
      id: node.id,
      name: node.name,
      slug: node.slug,
      description: node.description,
      productCount: total,
      children,
    };
  };

  return roots.sort((a, b) => a.position - b.position).map(finalize);
}

/** Resolves /produse/[category]/[subcategory] slugs against the tree. */
export function findCategoryPath(
  tree: CategoryNode[],
  slugs: string[],
): { category: CategoryNode; subcategory: CategoryNode | null } | null {
  const [first, second, ...rest] = slugs;
  if (!first || rest.length > 0) return null;
  const category = tree.find((c) => c.slug === first);
  if (!category) return null;
  if (!second) return { category, subcategory: null };
  const subcategory = category.children.find((c) => c.slug === second);
  return subcategory ? { category, subcategory } : null;
}

export function categoryHref(category: { slug: string }, parent?: { slug: string } | null) {
  return parent ? `/produse/${parent.slug}/${category.slug}` : `/produse/${category.slug}`;
}
