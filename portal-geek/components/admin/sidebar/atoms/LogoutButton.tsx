import { SignOutIcon } from "@phosphor-icons/react";

function LogoutIcon() {
  return (
    <SignOutIcon size={32} weight="light" />
  );
}

export function LogoutButton() {
  return (
    <button className="mt-2 text-[#1e1e1e] hover:opacity-70 transition-opacity shrink-0">
      <LogoutIcon />
    </button>
  );
}
