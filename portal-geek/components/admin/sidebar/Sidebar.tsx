import type { UserRole } from "@/types";

import { LogoutButton } from "./atoms/LogoutButton";
import { SidebarLogo } from "./atoms/SidebarLogo";
import { SidebarNav } from "./molecules/SidebarNav";

export function Sidebar({ role }: { role: UserRole }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-16 md:w-[102px] bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.08)] flex flex-col items-center py-6 z-50 border-r border-[#F0F0F0]">
      <SidebarLogo />
      <div className="flex-1 w-full overflow-y-auto">
        <SidebarNav role={role} />
      </div>
      <LogoutButton />
    </aside>
  );
}
