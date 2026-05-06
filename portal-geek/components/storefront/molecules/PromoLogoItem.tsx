"use client";

interface PromoLogoItemProps {
  name: string;
}

export function PromoLogoItem({ name }: PromoLogoItemProps) {
  return (
    <div
      className="text-2xl md:text-4xl font-bold tracking-tighter text-[#df2646] hover:text-black transition-colors cursor-default"
      style={{ fontFamily: "var(--font-alexandria), sans-serif" }}
    >
      {name}
    </div>
  );
}
