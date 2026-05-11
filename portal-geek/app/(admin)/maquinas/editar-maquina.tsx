"use client";

import { useState } from "react";

import MaquinaInput from "@/components/ui/atoms/FormInput";
import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { MaquinaCardProps } from "@/types";

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

interface EditarMaquinaProps {
  id: number;
  model: string;
  nickname: string;
  type: string;
  description: string;
  isOpen: boolean;
  onEdit: (row: MaquinaCardProps) => void;
  onClose: () => void;
}

export default function EditarMaquina({
  id,
  model,
  nickname,
  type,
  description,
  isOpen,
  onEdit,
  onClose,
}: EditarMaquinaProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [machineName, setMachineName] = useState("");
  const [machineNickname, setMachineNickname] = useState("");
  const [machineType, setMachineType] = useState("");
  const [machineDescription, setMachineDescription] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/maquinas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_maquina: machineName || undefined,
          apodo_maquina: machineNickname || undefined,
          tipo: machineType || type,
          descripcion: machineDescription || undefined,
        }),
      });
      if (!res.ok) {
        setError("Datos inválidos");
        return;
      }

      const json = await res.json();
      const data: MaquinaRaw = json.data;

      onEdit({
        id: data.id_maquina,
        model: data.nombre_maquina,
        nickname: data.apodo_maquina,
        type: data.tipo,
        store: data.sucursales.map((s) => s.sucursal.nombre_sucursal).join(", ") ?? "Sin asignar",
        description: data.descripcion ?? "",
        services: (data.servicios ?? []).map((s) => s.servicio.nombre_servicio),
        creation_date: data.fecha_registro,
        status: data.estatus,
        onDelete: () => {},
        onEdit: () => {},
      });

      window.alert("Máquina editada correctamente");
      onClose();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  }

  function validate(): boolean {
    let valid = true;
    if (
      machineName.length === 0 &&
      machineNickname.length === 0 &&
      machineType.length === 0 &&
      machineDescription.length === 0
    ) {
      valid = false;
      setError("No se modificó ningún campo");
    }
    return valid;
  }

  return (
    <ModalShell title="Editar máquina" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <MaquinaInput
          name="machineName"
          label="Modelo"
          placeholder={model}
          maxInputLength={100}
          onChange={(e) => setMachineName(e.target.value)}
        />
        <MaquinaInput
          name="machineNickname"
          label="Apodo"
          placeholder={nickname}
          maxInputLength={100}
          onChange={(e) => setMachineNickname(e.target.value)}
        />
        <div className="flex flex-col text-[13px] text-[#575757] mb-6">
          <label className="font-medium">Tipo</label>
          <select
            value={machineType}
            onChange={(e) => setMachineType(e.target.value)}
            className="w-full border rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors"
          >
            <option value="" disabled>
              {type}
            </option>
            <option value="Láser CO2">Láser CO2</option>
            <option value="Láser Fibra">Láser Fibra</option>
            <option value="Bordadora">Bordadora</option>
          </select>
        </div>
        <MaquinaInput
          name="machineDescription"
          label="Descripción"
          placeholder="Área de trabajo o especificaciones de la máquina"
          longText={true}
          placeholderLongText={description}
          maxInputLength={200}
          onChange={(e) => setMachineDescription(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px]">
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
