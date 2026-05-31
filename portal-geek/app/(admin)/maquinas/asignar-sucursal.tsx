"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/atoms";
import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
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
          sucursal: Number(selectedSucursal),
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
        onAssignStore: () => {},
        onAssignServices: () => {},
        onChangeStatus: () => {},
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
    <Modal
      isOpen
      onClose={onClose}
      title={`Asignar sucursal — ${nickname} (${model})`}
      size="lg"
      noPadding
    >
      {/* Same shape as asignar-servicios: scrollable body + static footer so
          the action bar is always visible and isolated from absolute popovers
          inside the body. */}
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col text-[13px] text-[#575757]">
            <label className="font-medium mb-1">Sucursal</label>
            <Select
              value={selectedSucursal}
              onChange={(value) => {
                setSelectedSucursal(value);
                setSucursalError(null);
              }}
              placeholder="Seleccionar sucursal..."
              size="sm"
              disabled={isLoading}
              error={sucursalError ?? undefined}
            >
              {sucursalOptions.map((s) => (
                <SelectOption key={s.id_sucursal} value={String(s.id_sucursal)}>
                  {s.nombre_sucursal}
                </SelectOption>
              ))}
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px] mt-4">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-[#e8e8e8] bg-white px-6 py-4">
          <Button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
