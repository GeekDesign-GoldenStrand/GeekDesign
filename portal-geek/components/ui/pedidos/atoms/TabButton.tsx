interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-[7px] font-ibm-plex text-[14px] font-medium transition-colors ${
        active ? "bg-[rgba(0,106,255,0.1)] text-[#006aff]" : "text-[#8e908f] hover:text-[#1e1e1e]"
      }`}
    >
      {children}
    </button>
  );
}
