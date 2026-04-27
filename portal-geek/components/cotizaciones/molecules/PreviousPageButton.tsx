import { ArrowLeft } from "@/components/cotizaciones/atoms/ArrowLeft";

export function PreviousPageButton() {
    return (
        <button className="flex items-center gap-2 text-sm font-medium">
            <ArrowLeft />
        </button>
    );
}