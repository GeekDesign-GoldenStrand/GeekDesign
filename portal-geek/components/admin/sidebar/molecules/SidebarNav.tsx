"use client";

import { usePathname } from "next/navigation";

import type { UserRole } from "@/types";

import { NavLink } from "../atoms/NavLink";
import { navItems } from "../navItems";

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1 items-center w-full">
      {visibleItems.map((item, index) => {
        if (item.type === "divider") {
          return <div key={`divider-${index}`} className="w-4/5 border-t border-[#E0E0E0] my-1" />;
        }

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
