import { Question, ShoppingCart } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { SearchBar } from "../molecules/SearchBar";

interface NavbarProps {
  categories?: { id: number; name: string }[];
}

export function Navbar({ categories = [] }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b-[1.5px] border-[#c2c0c0] w-full">
      {/* Row 1 — Logo · Search · Actions */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-[36px] h-[56px] md:h-[72px] flex items-center gap-3">
        {/* Logo */}
        <Link href="/storefront" className="flex items-center gap-[9px] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/storefront/logo.png"
            alt="Geek Design"
            width={36}
            height={36}
            className="object-cover md:w-[46px] md:h-[46px]"
          />
          <span
            className="hidden sm:block text-[#df2646] text-[13px] md:text-[16px] font-semibold tracking-[0.8px] uppercase whitespace-nowrap"
            style={{ fontFamily: "var(--font-alexandria), sans-serif" }}
          >
            Geek Design
          </span>
        </Link>

        {/* Search — grows to fill middle space */}
        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>

        {/* Actions — public storefront: Ayuda + cart only */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Link href="/ayuda" className="hidden md:flex items-center gap-[6px]">
            <Question size={32} weight="light" className="text-[#1e1e1e]" />
            <span className="text-[#1e1e1e] text-[16.742px] font-medium whitespace-nowrap">
              Ayuda
            </span>
          </Link>

          <Link href="/carrito" className="flex items-center gap-1">
            <ShoppingCart
              size={32}
              weight="light"
              className="text-[#1e1e1e]"
              aria-label="Carrito"
            />
            <span className="hidden md:block text-[#1e1e1e] text-[16.742px] font-medium whitespace-nowrap">
              Carro
            </span>
          </Link>
        </div>
      </div>

      {/* Row 2 — Category links (scrollable on small screens) */}
      {categories.length > 0 && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-[34px] h-[32px] md:h-[34px] flex items-center overflow-x-auto scrollbar-hide gap-6 sm:gap-10 lg:justify-between lg:gap-0">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/servicios/${cat.id}`}
              className="text-[#1e1e1e] text-[14px] md:text-[16.742px] font-bold whitespace-nowrap hover:text-[#df2646] transition-colors shrink-0"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
