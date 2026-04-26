"use client";

import Link from "next/link";
import { UserCircle } from "@phosphor-icons/react";

function UserIcon() {
  return (
    <UserCircle size={45} weight="light" />
  );
}

interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[118px] w-full items-center justify-between bg-white px-8 shadow-[0_4px_7px_rgba(0,0,0,0.25)]">
      <h1 className="font-ibm-plex font-semibold text-[40px] text-black">{title}</h1>
      <Link
        href="/perfil"
        aria-label="Mi perfil"
        className="flex h-[56px] w-[56px] items-center justify-center rounded-full text-[#555] hover:bg-[#fff0f0] hover:text-[#e42200] transition-colors"
      >
        <UserIcon />
      </Link>
    </header>
  );
}
