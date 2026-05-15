import Image from "next/image";

export function SidebarLogo() {
  return (
    <div className="mb-4 md:mb-6 shrink-0 transition-all">
      <Image
        src="/geekdesign.png"
        alt="GeekDesign"
        width={48}
        height={48}
        className="w-8 h-8 md:w-12 md:h-12"
      />
    </div>
  );
}
