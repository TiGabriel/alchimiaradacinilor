import { Fraunces, Manrope } from "next/font/google";

// latin-ext carries the Romanian letters ă â î ș ț (comma-below forms).
export const fontDisplay = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

export const fontSans = Manrope({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-manrope",
});
