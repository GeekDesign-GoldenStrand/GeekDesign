import Image from "next/image";
import Link from "next/link";

import { landingPath, normalizeRole, type Role } from "@/lib/auth/access";

interface SidebarLogoProps {
  role?: string | null;
}

export function SidebarLogo({ role }: SidebarLogoProps) {
  const target = role ? landingPath(normalizeRole(role) as Role) : "/dashboard";
  return (
    <div className="mb-4 md:mb-6 shrink-0 transition-all w-full px-2 flex justify-center">
      <Link
        href={target}
        aria-label="Ir al inicio"
        className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <Image
          src="/images/logo.png"
          alt="GeekDesign"
          width={88}
          height={114}
          priority
          className="w-12 h-auto md:w-[84px] object-contain"
        />
      </Link>
    </div>
  );
}
