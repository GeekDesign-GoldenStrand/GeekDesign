"use client";

import {
  MagnifyingGlassIcon,
  QuestionIcon,
  ShoppingCartIcon,
  TagIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CartBadge } from "../atoms/CartBadge";
import { SearchBar } from "../molecules/SearchBar";

interface NavbarProps {
  categories?: { id: number; name: string }[];
}

export function Navbar({ categories = [] }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  const linkCls = (href: string) =>
    `flex items-center gap-[6px] transition-opacity ${isActive(href) ? "text-[#df2646]" : "text-[#1e1e1e] hover:opacity-70"}`;

  const textCls = (href: string) =>
    `whitespace-nowrap leading-none mt-1 ${isActive(href) ? "underline underline-offset-2" : ""}`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b-[1.5px] border-[#c2c0c0] w-full">
      {/* Row 1 — Logo · Search · Actions */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-[36px] py-4 md:py-6 flex items-center gap-3">
        {/* Logo */}
        <Link href="/tienda" className="flex items-center gap-[9px] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/storefront/logo.png"
            alt="Geek Design"
            width={46}
            height={46}
            className="object-cover w-[36px] h-[36px] md:w-[46px] md:h-[46px]"
          />
          <span
            className="hidden sm:block text-[#df2646] text-[13px] md:text-[16px] font-semibold tracking-[0.8px] uppercase whitespace-nowrap leading-none mt-1"
            style={{ fontFamily: "var(--font-alexandria), sans-serif" }}
          >
            Geek Design
          </span>
        </Link>

        {/* Search — grows to fill middle space */}
        <div className="flex-1 flex justify-center items-center">
          <SearchBar />
        </div>

        {/* Actions — public storefront: Ayuda + cart only */}
        <div className="flex items-center gap-3 md:gap-5 shrink-0">
          <Link
            href="/tienda/promocionales"
            className={linkCls("/tienda/promocionales")}
            aria-label="Promocionales"
          >
            <TagIcon size={28} weight="light" aria-hidden="true" />
            <span
              className={`hidden lg:block text-[15px] md:text-[16px] font-medium ${textCls("/tienda/promocionales")}`}
            >
              Promocionales
            </span>
          </Link>

          <Link
            href="/tienda/cotizacion"
            className={linkCls("/tienda/cotizacion")}
            aria-label="Consultar Cotización"
          >
            <MagnifyingGlassIcon size={28} weight="light" aria-hidden="true" />
            <span
              className={`hidden lg:block text-[15px] md:text-[16px] font-medium ${textCls("/tienda/cotizacion")}`}
            >
              Seguimiento
            </span>
          </Link>

          <Link href="/tienda/ayuda" className={linkCls("/tienda/ayuda")} aria-label="Ayuda">
            <QuestionIcon size={28} weight="light" aria-hidden="true" />
            <span
              className={`hidden md:block text-[15px] md:text-[16px] font-medium ${textCls("/tienda/ayuda")}`}
            >
              Ayuda
            </span>
          </Link>

          <Link href="/tienda/carrito" className={`relative ${linkCls("/tienda/carrito")} gap-1`}>
            <ShoppingCartIcon size={32} weight="light" aria-label="Carrito" />
            <CartBadge />
            <span
              className={`hidden md:block text-[16.742px] font-medium ${textCls("/tienda/carrito")}`}
            >
              Carro
            </span>
          </Link>
        </div>
      </div>

      {/* Row 2 — Category links */}
      {categories.length > 0 && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-[34px] pb-4 flex items-center overflow-x-auto scrollbar-hide gap-6 sm:gap-10 lg:justify-between lg:gap-0 border-t border-gray-50 pt-3">
          {categories.map((cat) => {
            const href = `/tienda/servicios/${cat.id}`;
            return (
              <Link
                key={cat.id}
                href={href}
                className={`text-[14px] md:text-[15px] font-bold shrink-0 leading-none transition-colors ${
                  isActive(href)
                    ? "text-[#df2646] underline underline-offset-2"
                    : "text-[#1e1e1e] hover:text-[#df2646]"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
