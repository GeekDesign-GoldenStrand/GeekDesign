interface CharCounterProps {
  value: string;
  max: number;
}

export function CharCounter({ value, max }: CharCounterProps) {
  return (
    <p
      className={`text-[11px] mt-1 text-right ${value.length >= max ? "text-[#e42200]" : "text-[#8e908f]"}`}
    >
      {value.length}/{max}
    </p>
  );
}
