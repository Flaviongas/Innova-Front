import type { ReactNode } from "react";

/**
 * Outline status stamp. Tone is a semantic token name (info, warning,
 * success, danger) and must always be paired with a text label.
 */
export function StatusBadge({
  tone,
  children,
}: {
  tone: string;
  children: ReactNode;
}) {
  return <span className={`status status--${tone}`}>{children}</span>;
}
