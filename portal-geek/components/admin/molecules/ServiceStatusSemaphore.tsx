import { ServiceStatusDot } from "@/components/admin/atoms/ServiceStatusDot";

export type ServiceStatusSummary = {
  Pendiente: number;
  "En producción": number;
  Finalizado: number;
  Entregado: number;
  Cancelado: number;
};

interface Props {
  summary?: Partial<ServiceStatusSummary> | null;
}

const SERVICE_STATUS_STYLES = {
  Cancelado: {
    backgroundColor: "#B1B1B1",
    textColor: "#000000",
  },
  Pendiente: {
    backgroundColor: "#F7B9FF",
    textColor: "#700188",
  },
  "En producción": {
    backgroundColor: "#FFE4A5",
    textColor: "#8A6F02",
  },
  Finalizado: {
    backgroundColor: "#CCFFA5",
    textColor: "#2A940D",
  },
  Entregado: {
    backgroundColor: "#B9EEFF",
    textColor: "#043B66",
  },
} as const;

const STATUS_ORDER: Array<keyof ServiceStatusSummary> = [
  "Pendiente",
  "En producción",
  "Finalizado",
  "Entregado",
  "Cancelado",
];

export function ServiceStatusSemaphore({ summary }: Props) {
  const total = STATUS_ORDER.reduce((acc, status) => acc + (summary?.[status] ?? 0), 0);

  if (total === 0) {
    return <span className="text-[#8e908f] text-sm">—</span>;
  }

  return (
    <div className="flex justify-center items-center gap-1.5 flex-wrap">
      {STATUS_ORDER.map((status) => {
        const style = SERVICE_STATUS_STYLES[status];

        return (
          <ServiceStatusDot
            key={status}
            count={summary?.[status] ?? 0}
            label={status}
            backgroundColor={style.backgroundColor}
            textColor={style.textColor}
          />
        );
      })}
    </div>
  );
}
