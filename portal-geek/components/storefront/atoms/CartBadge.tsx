"use client";

import { useEffect, useState } from "react";

import { getCarrito, getTotalItems } from "@/lib/cart/storage";

export function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(getTotalItems(getCarrito().items));

    refresh();

    // Same-tab updates (add / remove)
    window.addEventListener("carrito:updated", refresh);
    // Cross-tab updates
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("carrito:updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-[#df2646] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-[3px] leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}
