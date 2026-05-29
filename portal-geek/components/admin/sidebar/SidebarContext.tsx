"use client";

import { createContext, useContext } from "react";

type SidebarContextValue = {
  desktopExpanded: boolean;
  mobileOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
};

export const SidebarContext = createContext<SidebarContextValue>({
  desktopExpanded: false,
  mobileOpen: false,
  onMenuOpen: () => {},
  onMenuClose: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}
