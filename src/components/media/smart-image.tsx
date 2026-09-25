"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { ImagePlaceholder, type PlaceholderKind } from "./image-placeholder";

type SmartImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string | null | undefined;
  alt: string;
  placeholderKind?: PlaceholderKind;
  placeholderTone?: string | null;
  /** Classes for the wrapper (which sets the aspect ratio). */
  wrapperClassName?: string;
  aspect?: "square" | "portrait" | "landscape" | "wide" | "auto";
};

const aspects = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/9]",
  auto: "",
} as const;

/**
 * next/image wrapper: fills an aspect-ratio box, fades in when loaded, and falls
 * back to a branded placeholder when the source is missing or fails to load.
 */
export function SmartImage({
  src,
  alt,
  placeholderKind,
  placeholderTone,
  wrapperClassName,
  aspect = "square",
  className,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  ...props
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn("relative overflow-hidden bg-paper-deep", aspects[aspect], wrapperClassName)}
    >
      {showImage ? (
        <Image
          src={src!}
          alt={alt}
          fill
          sizes={sizes}
          className={cn(
            "object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          {...props}
        />
      ) : (
        <ImagePlaceholder kind={placeholderKind} tone={placeholderTone} label={alt || undefined} />
      )}
    </div>
  );
}
