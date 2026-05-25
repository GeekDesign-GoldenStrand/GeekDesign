interface Props {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function ServiceFilterButton({ label, active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4
        py-2
        rounded-full
        text-sm
        font-semibold
        transition
        whitespace-nowrap
        ${
          active
            ? "bg-[#e42200] text-white"
            : "bg-white text-[#1e1e1e] border border-[#d1d1d1] hover:bg-[#f4f4f4]"
        }
      `}
    >
      {label}
    </button>
  );
}
