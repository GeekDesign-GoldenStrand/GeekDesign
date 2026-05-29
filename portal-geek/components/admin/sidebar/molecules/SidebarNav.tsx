"use client";

import { usePathname } from "next/navigation";

import { can } from "@/lib/auth/access";
import type { Role } from "@/lib/auth/access";
import type { UserRole } from "@/types";

import { NavLink } from "../atoms/NavLink";
import { navItems } from "../navItems";
import { useSidebar } from "../SidebarContext";

export function SidebarNav({ role, expanded }: { role: UserRole; expanded: boolean }) {
  const pathname = usePathname();
  const { onMenuClose } = useSidebar();

  // Visibility follows the policy: an item shows when the role may read its
  // section. Section-less items (Dashboard) are visible to any authenticated
  // user. role is already canonical (Administrador is normalized upstream).
  const visibleItems = navItems.filter(
    (item) => item.type === "divider" || !item.section || can(role as Role, item.section, "read")
  );

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
            iconHover={item.iconHover}
            iconActive={item.iconActive}
            isActive={isActive}
            expanded={expanded}
            onClick={onMenuClose}
          />
        );
      })}
    </nav>
  );
}
