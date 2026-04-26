import { PreviousPageButton } from "@/components/cotizaciones/molecules/PreviousPageButton";  
import { NextPageButton } from "@/components/cotizaciones/molecules/NextPageButton";
import { PaginationButton } from "@/components/cotizaciones/atoms/PaginationButton";
import { AdminHeader } from "@/components/ui/molecules/AdminHeader";
import { TercerosHeader } from "@/components/ui/terceros";  

export default function CotizacionesPage() {
    return (
        <div>       
            <AdminHeader title="Cotizaciones" />
        </div>
    );
}