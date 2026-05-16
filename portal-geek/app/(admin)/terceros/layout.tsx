import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terceros" };

export default function TercerosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
