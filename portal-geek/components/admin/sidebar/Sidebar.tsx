import { LogoutButton } from "./atoms/LogoutButton";
import { SidebarLogo } from "./atoms/SidebarLogo";
import { SidebarNav } from "./molecules/SidebarNav";

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-25.5 bg-white shadow-[0px_4px_7px_0px_rgba(0,0,0,0.25)] flex flex-col items-center py-6 z-50">
      <SidebarLogo />
      <SidebarNav />
      <LogoutButton />
    </aside>
  );
}
