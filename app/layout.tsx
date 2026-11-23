import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import "./marketing.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ayudas y Emergencias · Municipalidad de Temuco",
  description:
    "Panel territorial de casos, ayudas y emergencias de la Municipalidad de Temuco.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3574B5",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL">
      <body className={`${inter.variable} ${inter.className}`}>{children}</body>
    </html>
  );
}
