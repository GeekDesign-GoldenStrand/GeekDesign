"use client";

import { ListIcon, UserIcon } from "@phosphor-icons/react";
import Link from "next/link";

import { useSidebar } from "@/components/admin/sidebar/SidebarContext";

interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const { desktopExpanded, onMenuOpen } = useSidebar();

  return (
    <header
      className={`fixed top-0 right-0 z-20 flex h-[80px] md:h-[118px] items-center justify-between bg-white px-4 sm:px-8 shadow-[0_4px_7px_rgba(0,0,0,0.05)] border-b border-[#F5F5F5] transition-[left] duration-250 ease-in-out left-0 ${
        desktopExpanded ? "md:left-52" : "md:left-25.5"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label="Abrir menú"
          className="md:hidden shrink-0 p-1 text-[#575757] hover:text-[#e42200] transition-colors"
          onClick={onMenuOpen}
        >
          <ListIcon size={28} />
        </button>
        <h1 className="font-ibm-plex font-semibold text-[22px] sm:text-[24px] md:text-[40px] text-[#1e1e1e] truncate">
          {title}
        </h1>
      </div>
      <Link
        href="/perfil"
        aria-label="Mi perfil"
        className="flex h-[48px] w-[48px] md:h-[56px] md:w-[56px] items-center justify-center rounded-full text-[#555] hover:bg-[#fff0f0] hover:text-[#e42200] transition-colors shrink-0"
      >
        <UserIcon size={28} className="md:w-[32px] md:h-[32px]" aria-hidden />
      </Link>
    </header>
  );
}
