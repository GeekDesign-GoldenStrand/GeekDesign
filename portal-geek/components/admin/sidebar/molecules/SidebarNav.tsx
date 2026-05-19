"use client";

import { usePathname } from "next/navigation";

import type { UserRole } from "@/types";

import { NavLink } from "../atoms/NavLink";
import { navItems } from "../navItems";

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex flex-col gap-2 items-center w-full">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isActive}
          />
        );
      })}
    </nav>
  );
}
