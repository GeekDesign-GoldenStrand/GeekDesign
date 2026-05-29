"use client";

import { useState } from "react";

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

interface RegistrarFormProps {
  isOpen: boolean;
  onCreated: (row: MaquinaCardProps) => void;
  onClose: () => void;
}

export default function RegistrarForm({ isOpen, onCreated, onClose }: RegistrarFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [machineName, setMachineName] = useState("");
  const [machineNickname, setMachineNickname] = useState("");
  const [machineType, setMachineType] = useState("");
  const [machineDescription, setMachineDescription] = useState("");
  const [machineNameError, setMachineNameError] = useState<string | null>(null);
  const [machineNicknameError, setMachineNicknameError] = useState<string | null>(null);
  const [machineTypeError, setMachineTypeError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/maquinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_maquina: machineName,
          apodo_maquina: machineNickname,
          tipo: machineType,
          descripcion: machineDescription,
        }),
      });
      if (!res.ok) {
        setError("Datos inválidos");
        return;
      }

      const json = await res.json();
      const data: MaquinaRaw = json.data;

      onCreated({
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

      window.alert("Máquina registrada correctamente");
      onClose();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  }

  function validate(): boolean {
    let valid = true;
    if (machineName.length === 0) {
      setMachineNameError("El modelo es requerido");
      valid = false;
    }
    if (machineNickname.length === 0) {
      setMachineNicknameError("El apodo es requerido");
      valid = false;
    }
    if (machineType.length === 0) {
      setMachineTypeError("El tipo es requerido");
      valid = false;
    }
    return valid;
  }

  return (
    <ModalShell title="Registrar máquina" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <MaquinaInput
          name="machineName"
          label="Modelo"
          error={machineNameError}
          placeholder="Ej. CO2 100 Watts"
          required
          maxInputLength={100}
          onChange={(e) => setMachineName(e.target.value)}
        />
        <MaquinaInput
          name="machineNickname"
          label="Apodo"
          error={machineNicknameError}
          placeholder="Ej. Cardenal"
          required
          maxInputLength={100}
          onChange={(e) => setMachineNickname(e.target.value)}
        />
        <div className="flex flex-col text-[13px] text-[#575757] mb-6">
          <label className="font-medium">
            Tipo <span className="text-[#e42200]">*</span>
          </label>
          <Select
            value={machineType}
            onChange={setMachineType}
            placeholder="Seleccionar tipo..."
            size="sm"
            error={machineTypeError ?? undefined}
          >
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
          onChange={(e) => setMachineDescription(e.target.value)}
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
