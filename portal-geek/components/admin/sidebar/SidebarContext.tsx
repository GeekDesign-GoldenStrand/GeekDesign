"use client";

import { createContext, useContext } from "react";

type SidebarContextValue = {
  desktopExpanded: boolean;
  mobileOpen: boolean;
  onMenuOpen: () => void;
};

export const SidebarContext = createContext<SidebarContextValue>({
  desktopExpanded: false,
  mobileOpen: false,
  onMenuOpen: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}
