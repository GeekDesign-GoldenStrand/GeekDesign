import { ArrowRight } from "@/components/cotizaciones/atoms/ArrowRight";

export function NextPageButton() {
    return (
        <button className="flex items-center gap-2 text-sm font-medium text-[#1e1e1e]">
            <ArrowRight />
        </button>
    );
}