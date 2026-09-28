/**
 * Product photography manifest: one entry per original product image in
 * SOURCE_DIR. Pure data and naming rules — no file or network access — so the
 * rules are unit-tested (tests/unit/product-images.test.ts).
 *
 * Naming rule: the filename starts with the product name, followed by the
 * quantity ("lavender15ml-large-500x1350-eu.png" → "lavender", "15ml";
 * "air-x_15ml_large_1720x1350.png" → "air-x", "15ml"). Output:
 * `<ProductName>_<Quantity>_2000x2000.webp`, where ProductName is that same
 * name, capitalised as printed on the label.
 */

export const SOURCE_DIR = "doTerra uleiuri esentiale poze";
export const OUTPUT_DIR = "storage/product-images";
export const WORK_DIR = "storage/product-images/work";

/** Final square size, in pixels. Divisible by 16, as the image API requires. */
export const CANVAS = 2000;

/**
 * Where the product sits in every image, so all of them read as one photoshoot:
 * same scale, same baseline, centred. The producer's images share one scale (a
 * 1350 px tall frame fits the 15 ml bottle), so keeping that scale keeps real
 * sizes: a 5 ml bottle stays smaller than a 15 ml one. A 15 ml bottle ends up
 * about 1180 px tall, inside the crops the site applies to a square image (4:5
 * cards and gallery keep the middle 80% of the width; the 4:3 quick view on
 * phones keeps the middle 75% of the height).
 */
export const LAYOUT = {
  /** Height of the producer's image frame; other sizes are rejected. */
  sourceHeight: 1350,
  /** Scale from the producer's pixels to the canvas (never above 1). */
  scale: 0.9,
  /** y of the product's base: where it stands on the surface. */
  baseline: 1600,
} as const;

/** The central area that survives every crop used on the site. */
export const CROP_SAFE = {
  left: CANVAS * 0.1,
  right: CANVAS * 0.9,
  top: CANVAS * 0.125,
  bottom: CANVAS * 0.875,
} as const;

export type ParsedSource = { name: string; quantity: string };

/** Name (letters, optionally hyphenated), then the quantity, glued or separated. */
const NAME_AND_QUANTITY = /^(\p{L}+(?:-\p{L}+)*)[-_\s]*(\d+(?:[.,]\d+)?)\s?(ml|l|g|kg)(?!\p{L})/iu;

/**
 * Reads the product name and quantity from an original filename, or null when
 * the filename does not start with both (then the image needs a manual decision).
 *
 *   "lavender15ml-large-500x1350-eu.png" → { name: "lavender", quantity: "15ml" }
 *   "air-x_15ml_large_1720x1350.png"     → { name: "air-x", quantity: "15ml" }
 *   "Lavanda_10ml.png"                  → { name: "Lavanda", quantity: "10ml" }
 */
export function parseSourceFilename(filename: string): ParsedSource | null {
  const match = filename.match(NAME_AND_QUANTITY);
  if (!match) return null;
  return { name: match[1]!, quantity: `${match[2]}${match[3]!.toLowerCase()}` };
}

export function outputFilename(productName: string, quantity: string): string {
  return `${productName}_${quantity}_${CANVAS}x${CANVAS}.webp`;
}

export type ProductPhoto = {
  /** Original file in SOURCE_DIR. Never modified, renamed or moved. */
  source: string;
  /** The name from the filename, capitalised as on the label (same letters). */
  productName: string;
  quantity: string;
  /** Product name as printed on the label, for reference. */
  label: string;
  /**
   * Slug of the matching product on the site, or null when the catalogue has no
   * such product yet (it must be created in the admin before the image is used).
   */
  productSlug: string | null;
  /** Suggested alt text for the admin upload (Romanian, no claims). */
  alt: string;
  /** The environment around the product. Every prop has a reason to be there. */
  scene: string;
};

export const PRODUCT_PHOTOS: ProductPhoto[] = [
  {
    source: "lavender15ml-large-500x1350-eu.png",
    productName: "Lavender",
    quantity: "15ml",
    label: "Lavender — Lavandula angustifolia",
    productSlug: "lavender",
    alt: "Flacon Lavender 15 ml pe o placă de travertin, cu fire de lavandă",
    scene:
      "A pale honed travertine slab. A few fresh and dried sprigs of true lavender " +
      "(Lavandula angustifolia) lie loosely on the stone to the left, one sprig crossing " +
      "slightly behind the bottle on the left side. A fold of undyed linen at the back right. " +
      "Background: warm off-white plaster with the soft, out-of-focus violet haze of lavender " +
      "flowers low on the left. Warm late-afternoon light.",
  },
  {
    source: "lemon15ml-large-500x1350-eu.png",
    productName: "Lemon",
    quantity: "15ml",
    label: "Lemon — Citrus limon",
    productSlug: "lemon",
    alt: "Flacon Lemon 15 ml pe marmură deschisă, lângă lămâi proaspete",
    scene:
      "A light, softly veined marble surface. One whole lemon with two glossy leaves stands " +
      "behind the bottle on the right, a lemon half with a clean cut face lies in front of it " +
      "on the right, a single lemon leaf on the left. Background: bright cream plaster. " +
      "Fresh, bright morning light.",
  },
  {
    source: "peppermint15ml-large-500x1350-eu.png",
    productName: "Peppermint",
    quantity: "15ml",
    label: "Peppermint — Mentha piperita",
    productSlug: "peppermint",
    alt: "Flacon Peppermint 15 ml pe piatră gri deschis, cu frunze de mentă",
    scene:
      "A cool, pale grey limestone slab with a few fine water droplets on it. Fresh peppermint " +
      "sprigs (Mentha piperita) with crisp, serrated leaves lie to the left and behind on the " +
      "right. Background: soft sage-green plaster, out of focus. Clean, cool daylight.",
  },
  {
    source: "wildorange15ml-large-500x1350-eu.png",
    productName: "WildOrange",
    quantity: "15ml",
    label: "Wild Orange — Citrus sinensis",
    productSlug: "wild-orange",
    alt: "Flacon Wild Orange 15 ml pe lemn de stejar, lângă portocale dulci",
    scene:
      "A warm oiled oak board. Two whole sweet oranges with a leafy twig sit behind the bottle " +
      "on the right; a thin orange slice and a curl of peel lie in front on the left. " +
      "Background: warm clay-toned plaster. Soft golden sunlight.",
  },
  {
    source: "teatree15ml-large-500x1350-eu.png",
    productName: "TeaTree",
    quantity: "15ml",
    label: "Tea Tree — Melaleuca alternifolia",
    productSlug: "tea-tree",
    alt: "Flacon Tea Tree 15 ml pe pietre de râu, cu o ramură de arbore de ceai",
    scene:
      "The bottle stands on a flat, smooth river stone among a few other pale river stones. " +
      "A branch of tea tree (Melaleuca alternifolia) with fine, narrow needle-like leaves " +
      "rests behind on the left. A strip of natural linen at the right edge. Background: " +
      "muted green, like foliage in soft shade. Calm, even daylight.",
  },
  {
    source: "frankincense15ml-large-500x1350-eu.png",
    productName: "Frankincense",
    quantity: "15ml",
    label: "Frankincense — Boswellia spp.",
    productSlug: null,
    alt: "Flacon Frankincense 15 ml pe piatră caldă, cu lacrimi de rășină de tămâie",
    scene:
      "A weathered, warm sandstone surface. A small unglazed ceramic dish holding pale golden " +
      "frankincense resin tears sits behind the bottle on the right, with a few loose tears " +
      "on the stone in front on the left. Background: sand-toned plaster. Warm ochre light.",
  },
  {
    source: "lemongrass15ml-large-500x1350-eu.png",
    productName: "Lemongrass",
    quantity: "15ml",
    label: "Lemongrass — Cymbopogon flexuosus",
    productSlug: null,
    alt: "Flacon Lemongrass 15 ml pe lemn deschis, cu tulpini de lemongrass",
    scene:
      "A pale ash-wood surface. Fresh lemongrass stalks, trimmed, lie diagonally behind the " +
      "bottle, with a few long green blades arching up on the left. Background: soft " +
      "yellow-green plaster, out of focus. Bright, warm daylight.",
  },
  {
    source: "onguard15ml-large-500x1350-eu.png",
    productName: "OnGuard",
    quantity: "15ml",
    label: "On Guard — Essential Oil Blend",
    productSlug: null,
    alt: "Flacon On Guard 15 ml pe lemn cald, cu scorțișoară, cuișoare și coajă de portocală",
    scene:
      "A warm walnut surface. Botanicals from the blend: a small bundle of cinnamon sticks " +
      "behind on the right, a few whole cloves and a curl of orange peel in front on the left, " +
      "a sprig of rosemary and a eucalyptus leaf behind on the left. Background: warm terracotta " +
      "plaster. Cosy, warm light.",
  },
  {
    source: "air15ml-large-500x1350-eu.png",
    productName: "Air",
    quantity: "15ml",
    label: "Air — Clear Blend",
    productSlug: null,
    alt: "Flacon Air 15 ml pe piatră deschisă, cu ramuri de eucalipt, într-o lumină aerisită",
    scene:
      "A pale limestone ledge by an open window. A few eucalyptus branches with round " +
      "blue-green leaves and a sprig of laurel rest behind on the left. A sheer white linen " +
      "curtain, softly out of focus, at the back right. Background: airy pale blue-grey. " +
      "Bright, fresh, open light.",
  },
  {
    source: "zengest15ml-large-500x1350-eu.png",
    productName: "ZenGest",
    quantity: "15ml",
    label: "ZenGest — Supportive Blend",
    productSlug: null,
    alt: "Flacon ZenGest 15 ml pe lemn deschis, cu ghimbir, anason stelat și fenicul",
    scene:
      "A pale oak surface. Botanicals from the blend: a piece of fresh ginger root behind on " +
      "the right, two star anise pods in front on the left, a feathery fennel frond and a mint " +
      "sprig behind on the left. Background: soft warm beige plaster. Calm, soft light.",
  },
  {
    source: "abode-15ml-large-1720x1350.png",
    productName: "Abode",
    quantity: "15ml",
    label: "abōde — Refreshing Blend",
    productSlug: "amestec-casa-proaspata",
    alt: "Flacon abōde 15 ml pe un raft de lemn deschis, lângă lenjerie proaspătă",
    scene:
      "A pale oak shelf in a bright, tidy home. A neatly folded stack of fresh white linen " +
      "behind on the right, a small sprig of green eucalyptus in a clear glass of water " +
      "behind on the left. Background: soft off-white wall with window light. Fresh, clean " +
      "morning light.",
  },
  {
    source: "air-x_15ml_large_1720x1350.png",
    productName: "Air-X",
    quantity: "15ml",
    label: "Air-X — Essential Oil Blend",
    productSlug: "amestec-dimineata-senina",
    alt: "Flacon Air-X 15 ml pe piatră deschisă, în lumina dimineții",
    scene:
      "A pale limestone ledge by a window in early morning. A small branch of fresh green " +
      "leaves rests behind on the left; a folded light-grey linen cloth on the right. " +
      "Background: airy pale blue-grey, softly out of focus. Bright, fresh morning light.",
  },
  {
    source: "serenity15ml-large-500x1350-eu.png",
    productName: "Serenity",
    quantity: "15ml",
    label: "Serenity — Restful Blend",
    productSlug: "amestec-liniste-de-seara",
    alt: "Flacon Serenity 15 ml pe lemn cald, cu lavandă, mușețel și o păstaie de vanilie",
    scene:
      "A warm walnut surface in the evening. Botanicals from the blend: a few lavender sprigs " +
      "and small chamomile flowers behind on the left, a vanilla pod in front on the right. " +
      "A soft wool throw at the back right. Background: deep warm taupe. Low, warm evening " +
      "light.",
  },
  {
    source: "cinnamon5ml-large-404x1350-eu.png",
    productName: "Cinnamon",
    quantity: "5ml",
    label: "Cinnamon — Cinnamomum zeylanicum",
    productSlug: "cinnamon",
    alt: "Flacon Cinnamon 5 ml pe lemn cald, lângă batoane de scorțișoară",
    scene:
      "A warm oiled walnut board. A small bundle of Ceylon cinnamon quills (thin, layered " +
      "bark) tied with jute behind on the right, two loose quills in front on the left. " +
      "Background: warm terracotta plaster. Cosy, warm light.",
  },
];

/** Files in SOURCE_DIR deliberately not used, and why. */
export const SKIPPED_SOURCES: Record<string, string> = {
  "air-x.jpg": "smaller duplicate of air-x_15ml_large_1720x1350.png on a white background",
  "1103.webp": "smaller (460×460) duplicate of abode-15ml-large-1720x1350.png",
};

/**
 * Shared photography direction — the same for every image so the set reads as
 * one photoshoot. Brand palette from src/app/globals.css (paper, forest, sage,
 * clay, ochre).
 */
export const STYLE =
  "Professional commercial product photograph for Alchimia Rădăcinilor, a premium botanical " +
  "apothecary brand. The amber glass bottle in the kept (masked) area is the real product: keep " +
  "it exactly as it is, in the same place and at the same size; do not redraw, restyle, " +
  "duplicate or cover it. Build only the environment around it. " +
  "Camera: straight-on at the height of the label, 85 mm lens look, square 1:1 frame, the " +
  "bottle centred and standing on the surface (never floating). The surface runs across the " +
  "lower part of the frame with its back edge a little above the bottle's shoulder line; the " +
  "background is a softly out-of-focus wall. " +
  "Light: soft diffused daylight from the upper left with a gentle warm fill, matching the " +
  "existing highlights on the bottle; a soft, realistic contact shadow beneath the bottle " +
  "falling to the lower right, and a faint warm amber glow on the surface where light passes " +
  "through the glass. " +
  "Depth of field: surface and props near the bottle sharp, background falling off smoothly. " +
  "Colour: warm and natural, muted, gently low contrast, filmic; palette of warm paper " +
  "(#f8f4ec), deep forest green (#2d4a3a), sage (#8da38a), clay (#9a5234) and ochre (#a3781f) " +
  "accents alongside the natural colours of the botanicals. " +
  "Composition: generous negative space; props sit to the sides and behind, lower than the " +
  "label, never in front of the label or the cap; keep every element inside the central area " +
  "of the frame so a 4:5 or 4:3 crop loses nothing important. " +
  "Do not add any text, letters, logos, labels, watermarks, other bottles, packaging, hands or " +
  "people. Photorealistic, authentic, not glossy CGI.";

export function buildPrompt(photo: ProductPhoto): string {
  return `${STYLE}\n\nScene for ${photo.label} (${photo.quantity}): ${photo.scene}`;
}
