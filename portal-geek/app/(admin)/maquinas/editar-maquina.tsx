"use client";

import { useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import MaquinaInput from "@/components/ui/atoms/FormInput";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { SuccessModal } from "@/components/ui/atoms/SuccessModal";
import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import { stripEmoji } from "@/lib/utils/format";
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
  // Each field is seeded from the row's current value so the inputs read as
  // editable text (not as placeholders) — matching how Editar cotización
  // behaves. Equality with the seed is what `validate` / `handleSubmit` use to
  // detect whether the user actually changed anything.
  const [machineName, setMachineName] = useState(model);
  const [machineNickname, setMachineNickname] = useState(nickname);
  const [machineType, setMachineType] = useState(type);
  const [machineDescription, setMachineDescription] = useState(description);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reseed every field + clear the error banner each time the modal reopens
  // (false → true transition only). Using the React-recommended derive-during-
  // render pattern (https://react.dev/learn/you-might-not-need-an-effect)
  // instead of a useEffect with model/nickname/etc. in the deps — those props
  // change after `onEdit` updates the parent's row, and an effect would
  // immediately overwrite `submitSuccess=true` before the success modal can
  // mount.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setError(null);
      setMachineName(model);
      setMachineNickname(nickname);
      setMachineType(type);
      setMachineDescription(description ?? "");
      setSubmitSuccess(false);
    }
  }

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
          // Send only fields the user actually changed compared to the seed
          // values. `tipo` keeps sending the current value so the API contract
          // (which expects a non-null tipo) doesn't break on no-op edits.
          nombre_maquina: machineName !== model ? machineName : undefined,
          apodo_maquina: machineNickname !== nickname ? machineNickname : undefined,
          tipo: machineType || type,
          descripcion: machineDescription !== (description ?? "") ? machineDescription : undefined,
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

      // SuccessModal auto-dismisses after 1.5s and then closes this modal.
      setSubmitSuccess(true);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  }

  function validate(): boolean {
    const unchanged =
      machineName === model &&
      machineNickname === nickname &&
      machineType === type &&
      machineDescription === (description ?? "");
    if (unchanged) {
      setError("No se modificó ningún campo");
      return false;
    }
    return true;
  }

  if (submitSuccess) {
    return <SuccessModal message="Máquina editada correctamente" onClose={onClose} />;
  }

  return (
    <ModalShell title="Editar máquina" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <MaquinaInput
          name="machineName"
          label="Modelo"
          maxInputLength={30}
          value={machineName}
          onChange={(e) => setMachineName(stripEmoji(e.target.value))}
        />
        <MaquinaInput
          name="machineNickname"
          label="Apodo"
          maxInputLength={30}
          value={machineNickname}
          onChange={(e) => setMachineNickname(stripEmoji(e.target.value))}
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
          onChange={(e) => setMachineDescription(stripEmoji(e.target.value))}
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
