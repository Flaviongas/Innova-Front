import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Panel · Ayudas y Emergencias",
  description:
    "Panel operativo de casos, ayudas, documentos y reportes territoriales.",
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return children;
}
