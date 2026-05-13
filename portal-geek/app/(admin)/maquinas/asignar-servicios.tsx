"use client";

import { useEffect, useState } from "react";

import type { MultiSelectOption } from "@/components/ui/maquinas/molecules/MultiSelect";
import MultiSelect from "@/components/ui/maquinas/molecules/MultiSelect";
import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { MaquinaCardProps } from "@/types";

interface ServicioRaw {
  id_servicio: number;
  nombre_servicio: string;
}

interface MaquinaRaw {
  id_maquina: number;
  nombre_maquina: string;
  apodo_maquina: string;
  tipo: string;
  descripcion: string | null;
  estatus: string;
  fecha_registro: string;
  sucursales: { sucursal: { nombre_sucursal: string } }[];
  servicios?: { servicio: { nombre_servicio: string } }[];
}

interface AsignarServiciosProps {
  id: number;
  model: string;
  nickname: string;
  isOpen: boolean;
  onEdit: (row: MaquinaCardProps) => void;
  onClose: () => void;
}

export default function AsignarServicios({
  id,
  model,
  nickname,
  isOpen,
  onEdit,
  onClose,
}: AsignarServiciosProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [servicioOptions, setServicioOptions] = useState<MultiSelectOption[]>([]);
  const [selectedServicios, setSelectedServicios] = useState<MultiSelectOption[]>([]);
  const [servicioError, setServicioError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchServicios() {
      try {
        const res = await fetch("/api/servicios?activo=true&pageSize=100");
        if (!res.ok) throw new Error();
        const json = await res.json();
        const data: ServicioRaw[] = json.data ?? [];
        setServicioOptions(data.map((s) => ({ value: s.id_servicio, label: s.nombre_servicio })));
      } catch {
        setError("No se pudieron cargar los servicios");
      }
    }

    fetchServicios();
  }, [isOpen]);

  if (!isOpen) return null;

  function validate(): boolean {
    if (selectedServicios.length === 0) {
      setServicioError("Debes seleccionar al menos un servicio");
      return false;
    }
    return true;
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/maquinas/${id}/servicios`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicios: selectedServicios.map((s) => Number(s.value)),
        }),
      });

      if (!res.ok) {
        setError("Error al asignar servicios");
        return;
      }

      const json = await res.json();
      const data: MaquinaRaw = json.data;

      onEdit({
        id: data.id_maquina,
        model: data.nombre_maquina,
        nickname: data.apodo_maquina,
        type: data.tipo,
        store: data.sucursales.map((s) => s.sucursal.nombre_sucursal).join(", ") || "Sin asignar",
        description: data.descripcion ?? "",
        services: (data.servicios ?? []).map((s) => s.servicio.nombre_servicio),
        creation_date: data.fecha_registro,
        status: data.estatus,
        onDelete: () => {},
        onEdit: () => {},
        onAssignStore: () => {}, 
        onAssignServices: () => {},    
        onChangeStatus: () => {},   
      });

      window.alert("Servicios asignados correctamente");
      onClose();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ModalShell title={`Asignar servicios — ${nickname} (${model})`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col text-[13px] text-[#575757] mb-6">
          <label className="font-medium mb-1">Servicios</label>
          <MultiSelect
            options={servicioOptions}
            value={selectedServicios}
            onChange={(val) => {
              setSelectedServicios(val);
              setServicioError(null);
            }}
            placeholder="Seleccionar servicios..."
          />
          {servicioError && <p className="text-[12px] text-[#e42200] mt-1">{servicioError}</p>}
        </div>

        {error && (
          <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px] mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 text-[14px] font-medium text-white bg-[rgba(0,106,255,0.85)] rounded-[7px] hover:bg-[#006aff] transition-colors disabled:opacity-60"
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
