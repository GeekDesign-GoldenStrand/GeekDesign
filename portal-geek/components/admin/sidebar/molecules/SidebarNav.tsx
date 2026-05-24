"use client";

import { usePathname } from "next/navigation";

import { can } from "@/lib/auth/access";
import type { Role } from "@/lib/auth/access";
import type { UserRole } from "@/types";

import { NavLink } from "../atoms/NavLink";
import { navItems } from "../navItems";

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  // Visibility follows the policy: an item shows when the role may read its
  // section. Section-less items (Dashboard) are visible to any authenticated
  // user. role is already canonical (Administrador is normalized upstream).
  const visibleItems = navItems.filter(
    (item) => !item.section || can(role as Role, item.section, "read")
  );

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
