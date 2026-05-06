import { Question, ShoppingCart, Tag } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { SearchBar } from "../molecules/SearchBar";

interface NavbarProps {
  categories?: { id: number; name: string }[];
}

export function Navbar({ categories = [] }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b-[1.5px] border-[#c2c0c0] w-full">
      {/* Row 1 — Logo · Search · Actions */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-[36px] py-4 md:py-6 flex items-center gap-3">
        {/* Logo */}
        <Link href="/storefront" className="flex items-center gap-[9px] shrink-0">
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
            href="/promocionales"
            className="flex items-center gap-[6px] hover:opacity-70 transition-opacity"
          >
            <Tag size={28} weight="light" className="text-[#1e1e1e]" />
            <span className="hidden lg:block text-[#1e1e1e] text-[15px] md:text-[16px] font-medium whitespace-nowrap leading-none mt-1">
              Promocionales
            </span>
          </Link>

          <Link
            href="/ayuda"
            className="flex items-center gap-[6px] hover:opacity-70 transition-opacity"
          >
            <Question size={28} weight="light" className="text-[#1e1e1e]" />
            <span className="hidden md:block text-[#1e1e1e] text-[15px] md:text-[16px] font-medium whitespace-nowrap leading-none mt-1">
              Ayuda
            </span>
          </Link>

          <Link
            href="/carrito"
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <ShoppingCart
              size={28}
              weight="light"
              className="text-[#1e1e1e]"
              aria-label="Carrito"
            />
            <span className="hidden md:block text-[#1e1e1e] text-[15px] md:text-[16px] font-medium whitespace-nowrap leading-none mt-1">
              Carro
            </span>
          </Link>
        </div>
      </div>

      {/* Row 2 — Category links */}
      {categories.length > 0 && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-[34px] pb-4 flex items-center overflow-x-auto scrollbar-hide gap-6 sm:gap-10 lg:justify-between lg:gap-0 border-t border-gray-50 pt-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/servicios/${cat.id}`}
              className="text-[#1e1e1e] text-[14px] md:text-[15px] font-bold whitespace-nowrap hover:text-[#df2646] transition-colors shrink-0 leading-none"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
