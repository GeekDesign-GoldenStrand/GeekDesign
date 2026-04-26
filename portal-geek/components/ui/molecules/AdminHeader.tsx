"use client";

import { ProfileButton } from "../atoms/ProfileButton";

export function AdminHeader({title}: { title: string }) {
    return (
        <header
        className="sticky top-0 z-40 h-[7.375rem] bg-white shadow-[0px_4px_7px_0px_rgba(0,0,0,0.25)] flex items-center px-8 gap-8"
        >
        <h1 className="text-[40px] font-semibold text-[#1e1e1e]">
            {title}
        </h1>
        
        <div className="ml-auto flex items-center gap-4">
            <ProfileButton />
        </div>
        </header>
    );
}


