import Link from "next/link";

function UserIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[118px] w-full items-center justify-between bg-white px-8 shadow-[0_4px_7px_rgba(0,0,0,0.25)]">
      <h1 className="font-ibm-plex font-semibold text-[40px] text-black">{title}</h1>
      <Link
        href="/perfil"
        aria-label="Mi perfil"
        className="flex h-[56px] w-[56px] items-center justify-center rounded-full text-[#555] hover:bg-[#fff0f0] hover:text-[#e42200] transition-colors"
      >
        <UserIcon />
      </Link>
    </header>
  );
}
