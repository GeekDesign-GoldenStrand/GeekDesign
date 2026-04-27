import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PaginationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
    variant?: "number" | "arrow" | "ellipsis";
    children: ReactNode;
}

export function PaginationButton({
    active = false,
    variant = "number",
    children,
    className = "",
    ...rest
}: PaginationButtonProps) {
    const base =
        "inline-flex items-center justify-center size-[41px] rounded-[3.5px] text-[20px]";

    const style = active
        ? "bg-rojo-primario text-white"
        : variant === "arrow"
        ? "border border-[#5e5e5e] text-[#606060] hover:bg-gray-50"
        : variant === "ellipsis"
        ? "bg-[#ebebeb] text-gris-geek"
        : "bg-[#ebebeb] text-gris-geek hover:bg-gray-200";

    return (
        <button type="button" className={[base, style, className].join(" ")} {...rest}>
        {children}
        </button>
    );
}