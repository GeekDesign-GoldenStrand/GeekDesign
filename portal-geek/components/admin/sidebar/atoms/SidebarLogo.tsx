import Image from "next/image";

export function SidebarLogo() {
  return (
    <div className="mb-6 shrink-0">
      <Image src="/geekdesign.png" alt="GeekDesign" width={48} height={48} />
    </div>
  );
}
