import { MaterialCard } from "@/components/ui/materiales/organisms/MaterialCard";
import type { MaterialCardProps } from "@/types";

interface MaterialesGridProps {
  items: MaterialCardProps[];
}

export function MaterialesGrid({ items }: MaterialesGridProps) {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr_1fr_.9fr_1fr_auto] items-center gap-4 px-4 py-2 rounded-[6px] bg-[#c6c6c6] text-[#1e1e1e] text-[18px] font-semibold">
        <span>Nombre</span>
        <span>Unidad de medida</span>
        <span>Ancho</span>
        <span>Alto</span>
        <span>Grosor</span>
        <span>Color</span>
        <span>Imagen</span>
        <span />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <MaterialCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}
