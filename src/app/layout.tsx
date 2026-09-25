import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Alchimia Rădăcinilor",
  description: "Uleiuri esențiale și ritualuri botanice",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
