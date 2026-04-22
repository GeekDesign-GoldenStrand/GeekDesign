import Link from "next/link";

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
};

export function NavLink({ href, label, icon, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      title={label}
      className={`flex items-center justify-center w-full h-17 rounded-xs transition-colors ${
        isActive
          ? "bg-[#e42200] text-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
          : "text-[#1e1e1e] hover:bg-gray-100"
      }`}
    >
      {icon}
    </Link>
  );
}
