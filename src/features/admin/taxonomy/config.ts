import type { TaxonomyKind } from "@/validation/admin/taxonomy";

export type FieldSpec = {
  key:
    "name" | "slug" | "description" | "position" | "active" | "parentId" | "website" | "colorHex";
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "url" | "color" | "parent";
  hint?: string;
};

const common: FieldSpec[] = [
  { key: "name", label: "Nume", type: "text" },
  {
    key: "slug",
    label: "Slug",
    type: "text",
    hint: "Litere mici fără diacritice, cifre și cratime.",
  },
];
const description: FieldSpec = {
  key: "description",
  label: "Descriere",
  type: "textarea",
  hint: "Fără afirmații medicale sau terapeutice.",
};
const position: FieldSpec = {
  key: "position",
  label: "Ordine",
  type: "number",
  hint: "Mai mic = mai sus.",
};
const active: FieldSpec = { key: "active", label: "Activ (vizibil în magazin)", type: "checkbox" };

export const TAXONOMY_CONFIG: Record<
  TaxonomyKind,
  { title: string; singular: string; description: string; fields: FieldSpec[] }
> = {
  categorii: {
    title: "Categorii",
    singular: "categorie",
    description:
      "Arborele catalogului. O categorie cu subcategorii sau produse nu poate fi ștearsă.",
    fields: [
      ...common,
      { key: "parentId", label: "Categorie părinte", type: "parent" },
      description,
      position,
      active,
    ],
  },
  marci: {
    title: "Mărci",
    singular: "marcă",
    description: "Producătorii produselor din catalog.",
    fields: [...common, { key: "website", label: "Site web", type: "url" }, description, active],
  },
  colectii: {
    title: "Colecții",
    singular: "colecție",
    description: "Grupări editoriale de produse (se aleg din pagina produsului).",
    fields: [...common, description, position, active],
  },
  etichete: {
    title: "Etichete",
    singular: "etichetă",
    description: "Etichete folosite de produse, rutine, articole și quiz.",
    fields: common,
  },
  nevoi: {
    title: "Nevoi",
    singular: "nevoie",
    description: "Momentele pentru care clienții caută arome (folosite de quiz și recomandări).",
    fields: [...common, description, position],
  },
  arome: {
    title: "Profiluri aromatice",
    singular: "profil aromatic",
    description: "Familiile de arome (floral, citric…), cu o culoare pentru ilustrații.",
    fields: [
      ...common,
      { key: "colorHex", label: "Culoare", type: "color" },
      description,
      position,
    ],
  },
};
