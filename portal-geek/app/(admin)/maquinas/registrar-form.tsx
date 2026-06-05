"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/atoms";
import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { SuccessModal } from "@/components/ui/atoms/SuccessModal";
import MultiSelect, {
  type MultiSelectOption,
} from "@/components/ui/maquinas/molecules/MultiSelect";
import { stripEmoji } from "@/lib/utils/format";
import type { MaquinaCardProps } from "@/types";

const FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors";
const FIELD_ERROR = "border-[#e42200]";
const LABEL = "block text-[13px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

interface SucursalOption {
  id_sucursal: number;
  nombre_sucursal: string;
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
  const [selectedSucursal, setSelectedSucursal] = useState("");
  const [selectedServicios, setSelectedServicios] = useState<MultiSelectOption[]>([]);

  const [sucursalOptions, setSucursalOptions] = useState<SucursalOption[]>([]);
  const [servicioOptions, setServicioOptions] = useState<MultiSelectOption[]>([]);

  const [machineNameError, setMachineNameError] = useState<string | null>(null);
  const [machineNicknameError, setMachineNicknameError] = useState<string | null>(null);
  const [machineTypeError, setMachineTypeError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setMachineName("");
    setMachineNickname("");
    setMachineType("");
    setMachineDescription("");
    setSelectedSucursal("");
    setSelectedServicios([]);
    setMachineNameError(null);
    setMachineNicknameError(null);
    setMachineTypeError(null);
    setSubmitSuccess(false);

    const ac = new AbortController();

    Promise.all([
      fetch("/api/sucursales", { signal: ac.signal }).then((r) => r.json()),
      fetch("/api/servicios?activo=true&pageSize=100", { signal: ac.signal }).then((r) => r.json()),
    ])
      .then(([sucursalesPayload, serviciosPayload]) => {
        if (ac.signal.aborted) return;
        setSucursalOptions(sucursalesPayload.data ?? []);
        setServicioOptions(
          ((serviciosPayload.data ?? []) as { id_servicio: number; nombre_servicio: string }[]).map(
            (s) => ({ value: s.id_servicio, label: s.nombre_servicio })
          )
        );
      })
      .catch(() => {
        if (ac.signal.aborted) return;
      });

    return () => ac.abort();
  }, [isOpen]);

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
          descripcion: machineDescription || undefined,
        }),
      });
      if (!res.ok) {
        setError("Datos inválidos");
        return;
      }

      const json = await res.json();
      let data: MaquinaRaw = json.data;
      const newId: number = data.id_maquina;

      if (selectedSucursal) {
        const sucRes = await fetch(`/api/maquinas/${newId}/sucursales`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sucursal: Number(selectedSucursal) }),
        });
        if (sucRes.ok) data = (await sucRes.json()).data;
      }

      if (selectedServicios.length > 0) {
        const svcRes = await fetch(`/api/maquinas/${newId}/servicios`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ servicios: selectedServicios.map((s) => Number(s.value)) }),
        });
        if (svcRes.ok) data = (await svcRes.json()).data;
      }

      onCreated({
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

      setSubmitSuccess(true);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  }

  function validate(): boolean {
    let valid = true;
    if (!machineName.trim()) {
      setMachineNameError("El modelo es requerido");
      valid = false;
    }
    if (!machineNickname.trim()) {
      setMachineNicknameError("El apodo es requerido");
      valid = false;
    }
    if (!machineType) {
      setMachineTypeError("El tipo es requerido");
      valid = false;
    }
    return valid;
  }

  if (submitSuccess) {
    return <SuccessModal message="Máquina registrada correctamente" onClose={onClose} />;
  }

  return (
    <Modal isOpen onClose={onClose} title="Registrar Máquina" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>
              Modelo <span className="text-[#e42200]">*</span>
            </label>
            <input
              name="machineName"
              placeholder="Ej. CO2 100 Watts"
              maxLength={30}
              value={machineName}
              onChange={(e) => {
                setMachineName(stripEmoji(e.target.value));
                setMachineNameError(null);
              }}
              className={`${FIELD} ${machineNameError ? FIELD_ERROR : ""}`}
            />
            {machineNameError && <p className={ERROR_MSG}>{machineNameError}</p>}
          </div>

          <div>
            <label className={LABEL}>
              Apodo <span className="text-[#e42200]">*</span>
            </label>
            <input
              name="machineNickname"
              placeholder="Ej. Cardenal"
              maxLength={30}
              value={machineNickname}
              onChange={(e) => {
                setMachineNickname(stripEmoji(e.target.value));
                setMachineNicknameError(null);
              }}
              className={`${FIELD} ${machineNicknameError ? FIELD_ERROR : ""}`}
            />
            {machineNicknameError && <p className={ERROR_MSG}>{machineNicknameError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>
              Tipo <span className="text-[#e42200]">*</span>
            </label>
            <Select
              value={machineType}
              onChange={(v) => {
                setMachineType(v);
                setMachineTypeError(null);
              }}
              placeholder="Seleccionar tipo..."
              size="sm"
              error={machineTypeError ?? undefined}
            >
              <SelectOption value="Láser CO2">Láser CO2</SelectOption>
              <SelectOption value="Láser Fibra">Láser Fibra</SelectOption>
              <SelectOption value="Bordadora">Bordadora</SelectOption>
            </Select>
          </div>

          <div>
            <label className={LABEL}>Sucursal</label>
            <Select
              value={selectedSucursal}
              onChange={setSelectedSucursal}
              placeholder="Seleccionar sucursal..."
              size="sm"
            >
              {sucursalOptions.map((s) => (
                <SelectOption key={s.id_sucursal} value={String(s.id_sucursal)}>
                  {s.nombre_sucursal}
                </SelectOption>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className={LABEL}>Descripción</label>
          <textarea
            name="machineDescription"
            rows={4}
            maxLength={200}
            placeholder="Área de trabajo o especificaciones de la máquina"
            value={machineDescription}
            onChange={(e) => setMachineDescription(stripEmoji(e.target.value))}
            className={`${FIELD} resize-none`}
          />
        </div>

        <div>
          <label className={LABEL}>Servicios</label>
          <MultiSelect
            options={servicioOptions}
            value={selectedServicios}
            onChange={setSelectedServicios}
            placeholder="Seleccionar servicios..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
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
