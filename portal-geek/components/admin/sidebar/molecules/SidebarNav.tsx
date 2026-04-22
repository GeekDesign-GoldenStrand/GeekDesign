"use client";

import { usePathname } from "next/navigation";

import { NavLink } from "../atoms/NavLink";
import { navItems } from "../navItems";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col items-center gap-1 flex-1 w-full overflow-y-auto">
      {navItems.map((item) => {
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
