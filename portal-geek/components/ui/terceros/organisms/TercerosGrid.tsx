import { TerceroCard } from "@/components/ui/terceros/organisms/TerceroCard";
import type { TerceroCardProps } from "@/types";

interface TercerosGridProps {
  items: TerceroCardProps[];
}

export function TercerosGrid({ items }: TercerosGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((item) => (
        <TerceroCard key={`${item.role}-${item.id}`} {...item} />
      ))}
    </div>
  );
}
