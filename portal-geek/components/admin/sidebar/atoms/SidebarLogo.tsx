import Image from "next/image";

export function SidebarLogo() {
  return (
    <div className="mb-4 md:mb-6 shrink-0 transition-all w-full px-2 flex justify-center">
      <Image
        src="/images/logo.png"
        alt="GeekDesign"
        width={88}
        height={114}
        priority
        className="w-12 h-auto md:w-[84px] object-contain"
      />
    </div>
  );
}
