import { ServiceFilterButton } from "@/components/admin/atoms/ServiceFilterButton";

export interface PedidoServiceOption {
  id_servicio: number;
  nombre_servicio: string;
}

interface Props {
  services: PedidoServiceOption[];
  selectedServiceId: number | null;
  onSelectService: (id: number | null) => void;
}

export function PedidosServiceTabs({ services, selectedServiceId, onSelectService }: Props) {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-center gap-3 min-w-max">
        <ServiceFilterButton
          label="Todos"
          active={selectedServiceId === null}
          onClick={() => onSelectService(null)}
        />

        {services.map((service) => (
          <ServiceFilterButton
            key={service.id_servicio}
            label={service.nombre_servicio}
            active={selectedServiceId === service.id_servicio}
            onClick={() => onSelectService(service.id_servicio)}
          />
        ))}
      </div>
    </div>
  );
}
