"use client";

import { UserCircle } from "@phosphor-icons/react";

export function ProfileButton(onProfileClick?: () => void) {
    return (
        <button
        type="button"
        aria-label="Mi perfil"
        className= "inline-flex items-end justify-end"
        onClick={onProfileClick}
        >
            <UserCircle size={45} weight="thin" />
        </button>
    );
}