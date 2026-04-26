import Link from "next/link";

import { UserCircle } from "@phosphor-icons/react";

export function ProfileButton() {
    return (
        <Link
        href={"/perfil"}
        title={"Mi perfil"}
        className={"inline-flex items-end justify-end"}
        >
            <UserCircle size={45} weight="thin" />
        </Link>
    );
}