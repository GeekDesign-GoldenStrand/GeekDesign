"use client";

interface TerceroTypeTagProps {
  type: "Material" | "Servicio";
}

export function TerceroTypeTag({ type }: TerceroTypeTagProps) {
  const isMaterial = type === "Material";
  
  // Colors: 
  // Material: Mexican Pink (#E4007C)
  // Servicio: Pumpkin Orange (#FF7518)
  
  const styles = isMaterial
    ? "bg-[rgba(228,0,124,0.07)] border-[#E4007C] text-[#E4007C]"
    : "bg-[rgba(255,117,24,0.07)] border-[#FF7518] text-[#FF7518]";

  return (
    <span className={`px-2 py-0.5 rounded-[7px] border ${styles} text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] transition-all duration-300`}>
      {type}
    </span>
  );
}
