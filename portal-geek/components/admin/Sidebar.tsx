"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="6" y="22" width="8" height="16" rx="1" />
        <rect x="18" y="14" width="8" height="24" rx="1" />
        <rect x="30" y="8" width="8" height="30" rx="1" />
        <path d="M6 20 L14 14 L22 18 L38 8" strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="8" width="32" height="24" rx="3" />
        <path d="M4 15h32" />
        <circle cx="20" cy="24" r="5" />
        <path d="M20 21v6M18 24h4" />
      </svg>
    ),
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 6h12l4 6H10l4-6z" />
        <rect x="6" y="12" width="28" height="22" rx="2" />
        <path d="M14 20h12M14 26h8" />
      </svg>
    ),
  },
  {
    href: "/colaboradores",
    label: "Colaboradores",
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="22" cy="14" r="7" />
        <path d="M8 38c0-7.732 6.268-14 14-14s14 6.268 14 14" />
        <rect x="27" y="6" width="10" height="7" rx="1.5" />
        <path d="M30 6V4M34 6V4" />
      </svg>
    ),
  },
  {
    href: "/terceros",
    label: "Terceros",
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="14" r="6" />
        <path d="M6 38c0-6.627 5.373-12 12-12h4" />
        <circle cx="32" cy="30" r="6" />
        <path d="M32 27v2.5l2 1.5" />
        <path
          d="M29 28.5l1.5 1.5M35 28.5l-1.5 1.5M29 31.5l1.5-1.5M35 31.5l-1.5-1.5"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="16" cy="15" r="6" />
        <path d="M4 38c0-6.627 5.373-12 12-12" />
        <circle cx="30" cy="17" r="5" />
        <path d="M40 38c0-5.523-4.477-10-10-10" />
      </svg>
    ),
  },
  {
    href: "/maquinas",
    label: "Máquinas",
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="6" y="10" width="32" height="24" rx="3" />
        <rect x="12" y="16" width="10" height="12" rx="1" />
        <circle cx="30" cy="22" r="5" />
        <path d="M30 19v6M27 22h6" strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: (
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 20l16-12 16 12v18H6V20z" />
        <rect x="16" y="28" width="12" height="10" rx="1" />
        <path d="M16 24h12" />
      </svg>
    ),
  },
];

function LogoutIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16h14M20 10l6 6-6 6" />
      <path d="M18 6H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-25.5 bg-white shadow-[0px_4px_7px_0px_rgba(0,0,0,0.25)] flex flex-col items-center py-6 z-50">
      <div className="mb-6 shrink-0">
        <Image src="/geekdesign.png" alt="GeekDesign" width={48} height={48} />
      </div>

      <nav className="flex flex-col items-center gap-1 flex-1 w-full overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center justify-center w-full h-17 rounded-xs transition-colors ${
                isActive
                  ? "bg-[#e42200] text-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                  : "text-[#1e1e1e] hover:bg-gray-100"
              }`}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>

      <button className="mt-2 text-[#1e1e1e] hover:opacity-70 transition-opacity shrink-0">
        <LogoutIcon />
      </button>
    </aside>
  );
}
