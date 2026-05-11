interface InfoRowProps {
  label: string;
  value?: React.ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-2 py-2">
      <span className="w-[148px] shrink-0 font-ibm-plex text-[13px] text-[#8e908f]">{label}</span>
      <span className="flex-1 font-ibm-plex text-[13px] text-[#1e1e1e]">{value ?? "—"}</span>
    </div>
  );
}
