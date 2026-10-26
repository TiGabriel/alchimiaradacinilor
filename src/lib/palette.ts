/**
 * Site colour palette — pure and unit-tested (no I/O; the admin editor imports it).
 *
 * The tokens are the semantic colours of `src/app/globals.css` (`@theme`). The `theme`
 * setting stores a full palette; the root layout writes the colours that differ from
 * the defaults as CSS variables, so every Tailwind class picks them up without a rebuild.
 */

export const PALETTE_GROUPS = [
  { id: "surfaces", label: "Fundaluri" },
  { id: "text", label: "Text" },
  { id: "lines", label: "Linii" },
  { id: "brand", label: "Culorile brandului" },
  { id: "feedback", label: "Mesaje" },
] as const;

export type PaletteGroup = (typeof PALETTE_GROUPS)[number]["id"];

type TokenDefinition = {
  /** CSS custom property, without the leading `--color-`. */
  css: string;
  label: string;
  hint: string;
  group: PaletteGroup;
  /** Today's value in globals.css (kept in sync by a unit test). */
  value: string;
};

export const PALETTE_TOKENS = {
  paper: {
    css: "paper",
    label: "Fundalul paginii",
    hint: "Fundalul principal al site-ului.",
    group: "surfaces",
    value: "#f8f4ec",
  },
  paperDeep: {
    css: "paper-deep",
    label: "Fundal secțiuni alternante",
    hint: "Benzile mai închise de pe prima pagină, câmpurile, hover.",
    group: "surfaces",
    value: "#f0e9dc",
  },
  surface: {
    css: "surface",
    label: "Carduri și ferestre",
    hint: "Cardurile de produs, meniurile deschise, formularele.",
    group: "surfaces",
    value: "#fffdf9",
  },
  productBackdrop: {
    css: "product-backdrop",
    label: "Fundalul fotografiilor de produs",
    hint: "Fundalul din spatele produselor în fotografii și în categorii. Fotografiile sunt nuanțate spre această culoare, așa că o nuanță deschisă arată cel mai bine.",
    group: "surfaces",
    value: "#f0e9dc",
  },
  ink: {
    css: "ink",
    label: "Text principal",
    hint: "Titluri și textul articolelor.",
    group: "text",
    value: "#1e2620",
  },
  inkMuted: {
    css: "ink-muted",
    label: "Text secundar",
    hint: "Descrieri, date, explicații scurte.",
    group: "text",
    value: "#5b6358",
  },
  inkInverse: {
    css: "ink-inverse",
    label: "Text pe fundal închis",
    hint: "Textul de pe butoanele verzi și din subsol.",
    group: "text",
    value: "#f8f4ec",
  },
  line: {
    css: "line",
    label: "Linii despărțitoare",
    hint: "Marginile cardurilor și liniile dintre secțiuni.",
    group: "lines",
    value: "#e2d9c9",
  },
  lineStrong: {
    css: "line-strong",
    label: "Margini accentuate",
    hint: "Marginile câmpurilor și ale butoanelor conturate.",
    group: "lines",
    value: "#cfc3ae",
  },
  forest: {
    css: "forest",
    label: "Culoarea principală",
    hint: "Butoanele principale, linkurile, logo-ul.",
    group: "brand",
    value: "#2d4a3a",
  },
  forestDeep: {
    css: "forest-deep",
    label: "Principală, închisă",
    hint: "Subsolul site-ului și butoanele la hover.",
    group: "brand",
    value: "#213729",
  },
  forestSoft: {
    css: "forest-soft",
    label: "Principală, deschisă",
    hint: "Elementele selectate și fundalurile discrete.",
    group: "brand",
    value: "#e3ebe3",
  },
  sage: {
    css: "sage",
    label: "Salvie",
    hint: "Doar decor: frunze, ornamente, puncte de listă.",
    group: "brand",
    value: "#8da38a",
  },
  sageSoft: {
    css: "sage-soft",
    label: "Salvie, deschisă",
    hint: "Fundaluri decorative (ex. arcada din prima pagină).",
    group: "brand",
    value: "#e6ece2",
  },
  clay: {
    css: "clay",
    label: "Accent (lut)",
    hint: "Supratitlurile secțiunilor, butoanele de accent, numărul de produse salvate.",
    group: "brand",
    value: "#9a5234",
  },
  claySoft: {
    css: "clay-soft",
    label: "Accent, deschis",
    hint: "Fundaluri pentru etichete de accent.",
    group: "brand",
    value: "#f3e3d9",
  },
  ochre: {
    css: "ochre",
    label: "Ocru",
    hint: "Stelele din recenzii și ornamentele mici.",
    group: "brand",
    value: "#a3781f",
  },
  ochreSoft: {
    css: "ochre-soft",
    label: "Ocru, deschis",
    hint: "Fundaluri pentru etichete aurii.",
    group: "brand",
    value: "#f4ead2",
  },
  danger: {
    css: "danger",
    label: "Eroare",
    hint: "Mesajele de eroare și butoanele de ștergere.",
    group: "feedback",
    value: "#a33b2b",
  },
  dangerSoft: {
    css: "danger-soft",
    label: "Eroare, fundal",
    hint: "Fundalul mesajelor de eroare.",
    group: "feedback",
    value: "#f6e1dc",
  },
  success: {
    css: "success",
    label: "Reușită",
    hint: "Confirmările (ex. „Setările au fost salvate”).",
    group: "feedback",
    value: "#2f6b45",
  },
  successSoft: {
    css: "success-soft",
    label: "Reușită, fundal",
    hint: "Fundalul confirmărilor.",
    group: "feedback",
    value: "#e0ede3",
  },
  warning: {
    css: "warning",
    label: "Atenționare",
    hint: "Atenționările (ex. documente în lucru).",
    group: "feedback",
    value: "#8a5f10",
  },
  warningSoft: {
    css: "warning-soft",
    label: "Atenționare, fundal",
    hint: "Fundalul atenționărilor.",
    group: "feedback",
    value: "#f6ecd6",
  },
} as const satisfies Record<string, TokenDefinition>;

export type PaletteKey = keyof typeof PALETTE_TOKENS;
export type Palette = Record<PaletteKey, string>;

export const PALETTE_KEYS = Object.keys(PALETTE_TOKENS) as PaletteKey[];

export const DEFAULT_PALETTE: Palette = Object.fromEntries(
  PALETTE_KEYS.map((key) => [key, PALETTE_TOKENS[key].value]),
) as Palette;

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * Fills keys added to the palette after a theme was saved: the defaults, except the photo
 * backdrop, which follows the theme's `paperDeep` (the frame colour before it existed).
 */
export function completePalette(
  value: Partial<Record<PaletteKey, unknown>>,
): Partial<Record<PaletteKey, unknown>> {
  return {
    ...DEFAULT_PALETTE,
    productBackdrop: value.paperDeep ?? DEFAULT_PALETTE.productBackdrop,
    ...value,
  };
}

// ── Contrast (WCAG 2.2) ──────────────────────────────────────────────────

function channels(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

/** `fg` painted at `alpha` opacity over `bg` (how Tailwind's `/70` modifiers render). */
export function blend(fg: string, bg: string, alpha: number): string {
  const f = channels(fg);
  const b = channels(bg);
  return toHex(
    [0, 1, 2].map((i) => f[i]! * alpha + b[i]! * (1 - alpha)) as [number, number, number],
  );
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** A palette token, or a fixed colour the site uses next to the palette (white text). */
type PairColor = PaletteKey | { fixed: string; label: string };

export type ContrastPair = {
  id: string;
  label: string;
  fg: PairColor;
  bg: PaletteKey;
  /** Opacity of the foreground, for text such as `text-ink-inverse/70`. */
  fgAlpha?: number;
  /** 4.5 for text (WCAG AA), 3 for icons and large ornaments. */
  min: 4.5 | 3;
};

const WHITE = { fixed: "#ffffff", label: "Alb" };

/** Text/background pairs the site actually uses. Saving is refused while one fails. */
export const CONTRAST_PAIRS: ContrastPair[] = [
  {
    id: "ink-paper",
    label: "Text principal pe fundalul paginii",
    fg: "ink",
    bg: "paper",
    min: 4.5,
  },
  { id: "ink-surface", label: "Text principal pe carduri", fg: "ink", bg: "surface", min: 4.5 },
  {
    // Keeps the backdrop light: the photo filter only looks natural on a light colour.
    id: "ink-product-backdrop",
    label: "Text principal pe fundalul fotografiilor",
    fg: "ink",
    bg: "productBackdrop",
    min: 4.5,
  },
  {
    id: "ink-paper-deep",
    label: "Text principal pe secțiunile alternante",
    fg: "ink",
    bg: "paperDeep",
    min: 4.5,
  },
  {
    id: "muted-paper",
    label: "Text secundar pe fundalul paginii",
    fg: "inkMuted",
    bg: "paper",
    min: 4.5,
  },
  {
    id: "muted-surface",
    label: "Text secundar pe carduri",
    fg: "inkMuted",
    bg: "surface",
    min: 4.5,
  },
  {
    id: "muted-paper-deep",
    label: "Text secundar pe secțiunile alternante",
    fg: "inkMuted",
    bg: "paperDeep",
    min: 4.5,
  },
  { id: "forest-paper", label: "Linkuri pe fundalul paginii", fg: "forest", bg: "paper", min: 4.5 },
  { id: "forest-surface", label: "Linkuri pe carduri", fg: "forest", bg: "surface", min: 4.5 },
  {
    id: "inverse-forest",
    label: "Text pe butoanele principale",
    fg: "inkInverse",
    bg: "forest",
    min: 4.5,
  },
  {
    id: "inverse-forest-muted",
    label: "Text discret pe fundal verde (meniul de pe mobil)",
    fg: "inkInverse",
    fgAlpha: 0.7,
    bg: "forest",
    min: 4.5,
  },
  { id: "inverse-footer", label: "Text în subsol", fg: "inkInverse", bg: "forestDeep", min: 4.5 },
  {
    id: "inverse-footer-muted",
    label: "Text discret în subsol",
    fg: "inkInverse",
    fgAlpha: 0.7,
    bg: "forestDeep",
    min: 4.5,
  },
  {
    id: "deep-paper",
    label: "Butoane deschise pe fundal verde",
    fg: "forestDeep",
    bg: "paper",
    min: 4.5,
  },
  {
    id: "deep-forest-soft",
    label: "Elemente selectate",
    fg: "forestDeep",
    bg: "forestSoft",
    min: 4.5,
  },
  {
    id: "clay-paper",
    label: "Supratitluri pe fundalul paginii",
    fg: "clay",
    bg: "paper",
    min: 4.5,
  },
  { id: "clay-surface", label: "Supratitluri pe carduri", fg: "clay", bg: "surface", min: 4.5 },
  { id: "white-clay", label: "Text alb pe butoanele de accent", fg: WHITE, bg: "clay", min: 4.5 },
  {
    id: "white-danger",
    label: "Text alb pe butoanele de ștergere",
    fg: WHITE,
    bg: "danger",
    min: 4.5,
  },
  { id: "danger-surface", label: "Mesaje de eroare", fg: "danger", bg: "surface", min: 4.5 },
  {
    id: "danger-footer",
    label: "Mesaje de eroare în subsol (abonare)",
    fg: "dangerSoft",
    bg: "forestDeep",
    min: 4.5,
  },
  {
    id: "danger-soft",
    label: "Text pe fundalul erorilor",
    fg: "danger",
    bg: "dangerSoft",
    min: 4.5,
  },
  {
    id: "success-soft",
    label: "Text pe fundalul confirmărilor",
    fg: "success",
    bg: "successSoft",
    min: 4.5,
  },
  {
    id: "warning-soft",
    label: "Text pe fundalul atenționărilor",
    fg: "warning",
    bg: "warningSoft",
    min: 4.5,
  },
  { id: "ochre-surface", label: "Stelele din recenzii", fg: "ochre", bg: "surface", min: 3 },
];

export type ContrastResult = ContrastPair & {
  fgColor: string;
  bgColor: string;
  ratio: number;
  passes: boolean;
};

export function checkContrast(palette: Palette): ContrastResult[] {
  return CONTRAST_PAIRS.map((pair) => {
    const bgColor = palette[pair.bg];
    const base = typeof pair.fg === "string" ? palette[pair.fg] : pair.fg.fixed;
    const fgColor = pair.fgAlpha ? blend(base, bgColor, pair.fgAlpha) : base;
    const ratio = contrastRatio(fgColor, bgColor);
    // Rounded down to two decimals, as contrast checkers report it.
    return { ...pair, fgColor, bgColor, ratio, passes: Math.floor(ratio * 100) / 100 >= pair.min };
  });
}

export function failingPairs(palette: Palette): ContrastResult[] {
  return checkContrast(palette).filter((r) => !r.passes);
}

export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toLocaleString("ro-RO", { maximumFractionDigits: 2 })}:1`;
}

// ── CSS ──────────────────────────────────────────────────────────────────

/** The `--color-*` variables for a palette (used for previews). */
export function paletteVariables(palette: Palette): Record<string, string> {
  return Object.fromEntries(
    PALETTE_KEYS.map((key) => [`--color-${PALETTE_TOKENS[key].css}`, palette[key]]),
  );
}

/**
 * The overrides for the root layout: only the colours that differ from globals.css.
 * Unlayered, so it wins over Tailwind's `@layer theme` defaults. Null when nothing changed.
 */
export function paletteCss(palette: Palette): string | null {
  const declarations = PALETTE_KEYS.filter(
    (key) => HEX_COLOR.test(palette[key]) && palette[key].toLowerCase() !== DEFAULT_PALETTE[key],
  ).map((key) => `--color-${PALETTE_TOKENS[key].css}:${palette[key].toLowerCase()}`);
  if (productPhotoMatrix(palette.productBackdrop))
    declarations.push(`--product-photo-filter:url(#${PRODUCT_PHOTO_FILTER_ID})`);
  return declarations.length ? `:root{${declarations.join(";")}}` : null;
}

// ── Product photos ───────────────────────────────────────────────────────

/**
 * The backdrop baked into every product photo (BACKDROP in
 * scripts/product-images/compose.ts). Photos are opaque, so a palette colour
 * cannot show through them; they are tinted instead.
 */
export const PHOTO_BACKDROP = "#f0e9dc";

/** The SVG filter the root layout draws; `.product-photo` uses it (globals.css). */
export const PRODUCT_PHOTO_FILTER_ID = "fundal-produse";

/**
 * `feColorMatrix` values that scale each channel so the baked backdrop becomes `target`
 * (shading and shadows keep their proportions). Null when no tint is needed.
 */
export function productPhotoMatrix(target: string): string | null {
  if (!HEX_COLOR.test(target) || target.toLowerCase() === PHOTO_BACKDROP) return null;
  const to = channels(target);
  const from = channels(PHOTO_BACKDROP);
  const [r, g, b] = [0, 1, 2].map((i) => Number((to[i]! / from[i]!).toFixed(4)));
  return `${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`;
}

// ── Presets ──────────────────────────────────────────────────────────────

export type PalettePreset = { id: string; name: string; colors: Palette };

/** Ready-made palettes offered in the editor; each passes every contrast check (tested). */
export const BUILTIN_PRESETS: PalettePreset[] = [
  { id: "original", name: "Original (pădure și lut)", colors: DEFAULT_PALETTE },
  {
    id: "lavanda",
    name: "Lavandă de seară",
    colors: {
      ...DEFAULT_PALETTE,
      paper: "#f7f4f1",
      paperDeep: "#eee8e6",
      productBackdrop: "#eee8e6",
      surface: "#fffdfb",
      ink: "#231f26",
      inkMuted: "#5e5763",
      inkInverse: "#f7f4f1",
      line: "#e3dbdc",
      lineStrong: "#cdc2c6",
      forest: "#4b3a5e",
      forestDeep: "#352946",
      forestSoft: "#ebe4f0",
      sage: "#a593b5",
      sageSoft: "#eee8f2",
      clay: "#94475a",
      claySoft: "#f3e0e4",
    },
  },
  {
    id: "menta-cedru",
    name: "Mentă și cedru",
    colors: {
      ...DEFAULT_PALETTE,
      paper: "#f5f5f0",
      paperDeep: "#ebece4",
      productBackdrop: "#ebece4",
      surface: "#fdfdfa",
      ink: "#1b2424",
      inkMuted: "#56615f",
      inkInverse: "#f5f5f0",
      line: "#dde0d6",
      lineStrong: "#c6cbbd",
      forest: "#1f4d4f",
      forestDeep: "#163738",
      forestSoft: "#dfeceb",
      sage: "#84a9a3",
      sageSoft: "#e3eeec",
      clay: "#a14e2e",
      claySoft: "#f4e2d8",
    },
  },
];
