import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CotizacionesList } from "./cotizaciones-list";

import { PreviousPageButton } from "@/components/cotizaciones/molecules/PreviousPageButton";  
import { NextPageButton } from "@/components/cotizaciones/molecules/NextPageButton";
import { PaginationButton } from "@/components/cotizaciones/atoms/PaginationButton";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Cotizaciones — Geek Design" };

function CotizacionesHeader() {
    return (
        <div className="mx-auto mt-8 w-full max-w-7xl px-4">
            <div
            className="
                grid items-center justify-center gap-[60px] h-[54px] px-4
                lg:w-[1222px] md:w-full 
                bg-gray-100 rounded-lg
                grid-cols-[1fr_1fr_140px_54px]
                md:grid-cols-[1fr_1fr_1fr_1fr_140px_54px]
                lg:grid-cols-[auto_auto_auto_auto_auto_auto_auto_auto]
                text-sm md:text-base lg:text-[18px]
                font-bold font-['IBM_Plex_Sans_JP',sans-serif] text-black
            "
            >
            {/* Visible on all screen sizes */}
            <span>Fecha de Creación</span>
            <span>Monto Total</span>

            {/* Visible on md and up */}
            <span className="hidden md:block">Entrega Estimada</span>
            <span className="hidden md:block">Empresa</span>

            {/* Visible on lg and up */}
            <span className="hidden lg:block">Cliente</span>
            <span className="hidden lg:block">Folio</span>

            {/* Visible on all screen sizes */}
            <span className="text-center">Estatus</span>
            <span className="sr-only">Acciones</span>
            </div>
            </div>
    );
}

export default function CotizacionesPage() {
    return (
        <div>       
            <AdminHeader title="Cotizaciones" />
            <CotizacionesHeader />
        </div>

    );
}