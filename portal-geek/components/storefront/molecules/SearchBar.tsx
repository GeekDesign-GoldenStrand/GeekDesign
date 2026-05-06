"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/storefront?q=${encodeURIComponent(q)}` : "/storefront");
  }

  function clearSearch() {
    setQuery("");
    router.push("/storefront");
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#fffcfc] border-[1.196px] border-[#ecf4ff] rounded-[4px] h-[40px] md:h-[48px] w-full max-w-[785px] flex items-center justify-between px-[9.567px] gap-[11.958px]"
    >
      <div className="flex items-center gap-[11.958px] flex-1 min-w-0">
        <MagnifyingGlass size={28} weight="light" className="shrink-0 text-[#1e1e1e]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar servicios..."
          className="bg-transparent outline-none border-none text-[#1e1e1e] text-[14px] md:text-[16.74px] font-medium w-full placeholder:text-[#1e1e1e] placeholder:opacity-50"
        />
      </div>

      {query.length > 0 && (
        <button
          type="button"
          onClick={clearSearch}
          className="shrink-0 flex items-center justify-center hover:opacity-60 transition-opacity"
        >
          <X size={19} weight="light" className="text-[#1e1e1e]" />
        </button>
      )}
    </form>
  );
}
