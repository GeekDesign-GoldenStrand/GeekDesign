interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section>
      <h3 className="mb-3 font-ibm-plex text-[14px] font-semibold text-[#555] uppercase tracking-wide">
        {title}
      </h3>
      <div className="divide-y divide-[#f0f0f0] rounded-[8px] border border-[#e8e8e8] px-4">
        {children}
      </div>
    </section>
  );
}
