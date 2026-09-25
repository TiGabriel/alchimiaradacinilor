import type { ProductType } from "@/generated/prisma/enums";

import type { PlaceholderKind } from "./image-placeholder";
import { SmartImage } from "./smart-image";

const kindByType: Record<ProductType, PlaceholderKind> = {
  INDIVIDUAL_OIL: "bottle",
  BLEND: "bottle",
  KIT: "kit",
  DIFFUSER: "diffuser",
  ACCESSORY: "accessory",
  OTHER: "leaf",
};

export function placeholderKindFor(type: ProductType): PlaceholderKind {
  return kindByType[type];
}

type ProductImageProps = {
  name: string;
  productType: ProductType;
  image?: { url: string; alt?: string | null } | null;
  /** Accent for the placeholder (e.g. primary aroma colour). */
  tone?: string | null;
  aspect?: "square" | "portrait";
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/** Product photo with a product-type-aware branded placeholder. */
export function ProductImage({
  name,
  productType,
  image,
  tone,
  aspect = "portrait",
  sizes,
  priority,
  className,
}: ProductImageProps) {
  return (
    <SmartImage
      src={image?.url}
      alt={image?.alt ?? name}
      aspect={aspect}
      sizes={sizes}
      priority={priority}
      placeholderKind={placeholderKindFor(productType)}
      placeholderTone={tone}
      wrapperClassName={className}
    />
  );
}
