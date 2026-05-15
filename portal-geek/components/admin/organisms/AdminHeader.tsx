import { User } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[80px] md:h-[118px] w-full items-center justify-between bg-white px-4 sm:px-8 shadow-[0_4px_7px_rgba(0,0,0,0.05)] border-b border-[#F5F5F5]">
      <h1 className="font-ibm-plex font-semibold text-[22px] sm:text-[24px] md:text-[40px] text-[#1e1e1e] truncate pr-4">
        {title}
      </h1>
      <Link
        href="/perfil"
        aria-label="Mi perfil"
        className="flex h-[48px] w-[48px] md:h-[56px] md:w-[56px] items-center justify-center rounded-full text-[#555] hover:bg-[#fff0f0] hover:text-[#e42200] transition-colors shrink-0"
      >
        <User size={28} className="md:w-[32px] md:h-[32px]" aria-hidden />
      </Link>
    </header>
  );
}
