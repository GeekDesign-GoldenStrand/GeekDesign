"use client";

import { useEffect, useState } from "react";

import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { MaquinaCardProps } from "@/types";

interface SucursalRaw {
  id_sucursal: number;
  nombre_sucursal: string;
  direccion: string;
  estatus: string;
  horario_apertura: string;
  horario_salida: string;
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

interface AsignarSucursalProps {
  id: number;
  model: string;
  nickname: string;
  isOpen: boolean;
  onEdit: (row: MaquinaCardProps) => void;
  onClose: () => void;
}

export default function AsignarSucursal({
  id,
  model,
  nickname,
  isOpen,
  onEdit,
  onClose,
}: AsignarSucursalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sucursalOptions, setSucursalOptions] = useState<SucursalRaw[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string>("");
  const [sucursalError, setSucursalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchSucursales() {
      try {
        const res = await fetch("/api/sucursales");
        if (!res.ok) throw new Error();
        const json = await res.json();
        setSucursalOptions(json.data ?? []);
      } catch {
        setError("No se pudieron cargar las sucursales");
      }
    }

    fetchSucursales();
  }, [isOpen]);

  if (!isOpen) return null;

  function validate(): boolean {
    if (!selectedSucursal) {
      setSucursalError("Debes seleccionar una sucursal");
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
      const res = await fetch(`/api/maquinas/${id}/sucursales`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursales: [Number(selectedSucursal)],
        }),
      });

      if (!res.ok) {
        setError("Error al asignar sucursal");
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
      });

      window.alert("Sucursal asignada correctamente");
      onClose();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ModalShell title={`Asignar sucursal — ${nickname} (${model})`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col text-[13px] text-[#575757] mb-6">
          <label className="font-medium mb-1">Sucursal</label>
          <select
            value={selectedSucursal}
            onChange={(e) => {
              setSelectedSucursal(e.target.value);
              setSucursalError(null);
            }}
            className={[
              "w-full border rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] transition-colors",
              sucursalError ? "border-[#df2646]" : "border-[#b9b8b8]",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <option value="" disabled>
              Seleccionar sucursal...
            </option>
            {sucursalOptions.map((s) => (
              <option key={s.id_sucursal} value={s.id_sucursal}>
                {s.nombre_sucursal}
              </option>
            ))}
          </select>
          {sucursalError && <p className="text-[12px] text-[#e42200] mt-1">{sucursalError}</p>}
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
