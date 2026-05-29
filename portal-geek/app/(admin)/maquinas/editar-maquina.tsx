"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import MaquinaInput from "@/components/ui/atoms/FormInput";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
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
  const [machineDescription, setMachineDescription] = useState(description);
  const [descriptionTouched, setDescriptionTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMachineDescription(description ?? "");
      setDescriptionTouched(false);
    }
  }, [isOpen, description]);

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
          descripcion: descriptionTouched ? machineDescription || "" : undefined,
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
        onAssignStore: () => {},
        onAssignServices: () => {},
        onChangeStatus: () => {},
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
    if (
      machineName.length === 0 &&
      machineNickname.length === 0 &&
      machineType.length === 0 &&
      !descriptionTouched
    ) {
      setError("No se modificó ningún campo");
      return false;
    }
    return true;
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
          <Select value={machineType} onChange={setMachineType} placeholder={type} size="sm">
            <SelectOption value="Láser CO2">Láser CO2</SelectOption>
            <SelectOption value="Láser Fibra">Láser Fibra</SelectOption>
            <SelectOption value="Bordadora">Bordadora</SelectOption>
          </Select>
        </div>
        <MaquinaInput
          name="machineDescription"
          label="Descripción"
          placeholder="Área de trabajo o especificaciones de la máquina"
          longText={true}
          placeholderLongText="Área de trabajo o especificaciones de la máquina"
          maxInputLength={200}
          value={machineDescription}
          onChange={(e) => {
            setMachineDescription(e.target.value);
            setDescriptionTouched(true);
          }}
        />
        {error && (
          <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px]">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
