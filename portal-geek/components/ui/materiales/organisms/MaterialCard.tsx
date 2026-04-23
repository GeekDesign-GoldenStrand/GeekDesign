import { EditIcon } from "@/components/ui/atoms/icons";
import type { MaterialCardProps } from "@/types";

function ColorSwatch({ value }: { value: string }) {
  const hasColor = value !== "-";
  return (
    <span
      aria-label={hasColor ? `Color ${value}` : "Sin color"}
      className="inline-block h-6 w-6 rounded-full border border-[#1e1e1e]"
      style={{ backgroundColor: hasColor ? value : "#d9d9d9" }}
    />
  );
}

function PreviewImage({ imageUrl, name }: { imageUrl: string; name: string }) {
  return (
    <div className="relative h-[3.75rem] w-[3.75rem] rounded-[4px] overflow-hidden bg-[#d9d9d9] shrink-0">
      {imageUrl ? (
        // Use native img 
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}

export function MaterialCard({
  id,
  name,
  unit,
  color,
  width,
  height,
  thickness,
  imageUrl,
}: MaterialCardProps) {
  return (
    <article className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr_1fr_.9fr_1fr_auto] items-center gap-4 px-4 py-3 bg-white rounded-[7px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.14)]">
      <p className="text-[28px] text-[#1e1e1e]">{name}</p>
      <p className="text-[28px] text-[#1e1e1e]">{unit}</p>
      <p className="text-[28px] text-[#1e1e1e]">{width}</p>
      <p className="text-[28px] text-[#1e1e1e]">{height}</p>
      <p className="text-[28px] text-[#1e1e1e]">{thickness}</p>
      <ColorSwatch value={color} />
      <PreviewImage imageUrl={imageUrl} name={name} />
      <button
        aria-label={`Editar material ${id}`}
        className="text-[#1e1e1e] hover:opacity-70 transition-opacity"
      >
        <EditIcon size={20} />
      </button>
    </article>
  );
}
