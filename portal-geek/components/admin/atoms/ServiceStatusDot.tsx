interface Props {
  count: number;
  backgroundColor: string;
  textColor: string;
  label: string;
}

export function ServiceStatusDot({ count, backgroundColor, textColor, label }: Props) {
  if (count <= 0) return null;

  return (
    <span
      title={`${label}: ${count}`}
      aria-label={`${label}: ${count}`}
      className="
        inline-flex
        items-center
        justify-center
        w-7
        h-7
        rounded-full
        text-sm
        font-bold
        shrink-0
      "
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {count}
    </span>
  );
}
