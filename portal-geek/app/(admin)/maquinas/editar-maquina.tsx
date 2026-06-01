"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/atoms";
import { Button } from "@/components/ui/atoms/Button";
import MaquinaInput from "@/components/ui/atoms/FormInput";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { SuccessModal } from "@/components/ui/atoms/SuccessModal";
import MultiSelect, {
  type MultiSelectOption,
} from "@/components/ui/maquinas/molecules/MultiSelect";
import { stripEmoji } from "@/lib/utils/format";
import type { MaquinaCardProps } from "@/types";

interface SucursalOption {
  id_sucursal: number;
  nombre_sucursal: string;
}

interface MaquinaFresh {
  id_maquina: number;
  nombre_maquina: string;
  apodo_maquina: string;
  tipo: string;
  descripcion: string | null;
  estatus: string;
  fecha_registro: string;
  sucursales: { id_sucursal: number; sucursal: { nombre_sucursal: string } }[];
  servicios: { id_servicio: number; servicio: { nombre_servicio: string } }[];
}

function mapMaquina(data: MaquinaFresh): MaquinaCardProps {
  return {
    id: data.id_maquina,
    model: data.nombre_maquina,
    nickname: data.apodo_maquina,
    type: data.tipo,
    store: data.sucursales.map((s) => s.sucursal.nombre_sucursal).join(", ") || "Sin asignar",
    description: data.descripcion ?? "",
    services: data.servicios.map((s) => s.servicio.nombre_servicio),
    creation_date: data.fecha_registro,
    status: data.estatus,
    onDelete: () => {},
    onEdit: () => {},
    onAssignStore: () => {},
    onAssignServices: () => {},
    onChangeStatus: () => {},
  };
}

interface EditarMaquinaProps {
  id: number;
  isOpen: boolean;
  onEdit: (row: MaquinaCardProps) => void;
  onClose: () => void;
}

export default function EditarMaquina({ id, isOpen, onEdit, onClose }: EditarMaquinaProps) {
  const [freshData, setFreshData] = useState<MaquinaFresh | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !id) return;

    setFreshData(null);
    setFetchError(null);
    setSubmitSuccess(false);
    setServerError(null);
    setMachineNameError(null);
    setMachineNicknameError(null);
    setMachineTypeError(null);

    const ac = new AbortController();

    Promise.all([
      fetch(`/api/maquinas/${id}`, { signal: ac.signal }).then((r) => r.json()),
      fetch("/api/sucursales", { signal: ac.signal }).then((r) => r.json()),
      fetch("/api/servicios?activo=true&pageSize=100", { signal: ac.signal }).then((r) => r.json()),
    ])
      .then(([maquinaPayload, sucursalesPayload, serviciosPayload]) => {
        if (ac.signal.aborted) return;

        const maquina: MaquinaFresh = maquinaPayload.data;
        setFreshData(maquina);
        setMachineName(maquina.nombre_maquina);
        setMachineNickname(maquina.apodo_maquina);
        setMachineType(maquina.tipo);
        setMachineDescription(maquina.descripcion ?? "");
        setSelectedSucursal(
          maquina.sucursales[0]?.id_sucursal ? String(maquina.sucursales[0].id_sucursal) : ""
        );

        setSucursalOptions(sucursalesPayload.data ?? []);

        const svcOpts: MultiSelectOption[] = (
          (serviciosPayload.data ?? []) as { id_servicio: number; nombre_servicio: string }[]
        ).map((s) => ({ value: s.id_servicio, label: s.nombre_servicio }));
        setServicioOptions(svcOpts);

        const currentServiceIds = new Set(maquina.servicios.map((s) => s.id_servicio));
        setSelectedServicios(svcOpts.filter((opt) => currentServiceIds.has(Number(opt.value))));
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setFetchError("No se pudieron cargar los datos. Intenta de nuevo.");
      });

    return () => ac.abort();
  }, [isOpen, id]);

  if (!isOpen) return null;

  if (submitSuccess) {
    return <SuccessModal message="Máquina editada correctamente" onClose={onClose} />;
  }

  const isLoadingFresh = !freshData && !fetchError;

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

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate() || !freshData) return;

    setServerError(null);
    setIsLoading(true);

    try {
      const basicRes = await fetch(`/api/maquinas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_maquina: machineName,
          apodo_maquina: machineNickname,
          tipo: machineType,
          descripcion: machineDescription || undefined,
        }),
      });
      if (!basicRes.ok) {
        setServerError("Error al actualizar los datos");
        return;
      }
      let finalData: MaquinaFresh = (await basicRes.json()).data;

      const originalSucursalId = freshData.sucursales[0]?.id_sucursal ?? null;
      const newSucursalId = selectedSucursal ? Number(selectedSucursal) : null;
      if (newSucursalId && newSucursalId !== originalSucursalId) {
        const sucRes = await fetch(`/api/maquinas/${id}/sucursales`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sucursal: newSucursalId }),
        });
        if (!sucRes.ok) {
          setServerError("Error al asignar la sucursal");
          return;
        }
        finalData = (await sucRes.json()).data;
      }

      const originalServiceIds = freshData.servicios
        .map((s) => s.id_servicio)
        .sort()
        .join(",");
      const newServiceIds = selectedServicios
        .map((s) => Number(s.value))
        .sort()
        .join(",");
      if (newServiceIds !== originalServiceIds) {
        const svcRes = await fetch(`/api/maquinas/${id}/servicios`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ servicios: selectedServicios.map((s) => Number(s.value)) }),
        });
        if (!svcRes.ok) {
          setServerError("Error al asignar los servicios");
          return;
        }
        finalData = (await svcRes.json()).data;
      }

      onEdit(mapMaquina(finalData));
      setSubmitSuccess(true);
    } catch {
      setServerError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Editar Máquina" size="2xl">
      {isLoadingFresh && (
        <p className="text-[#8e908f] text-[14px]">Cargando datos de la máquina...</p>
      )}

      {fetchError && (
        <p role="alert" className="text-[#e42200] text-[14px]">
          {fetchError}
        </p>
      )}

      {!isLoadingFresh && !fetchError && freshData && (
        <form onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="rounded-md bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2 mb-4">
              {serverError}
            </div>
          )}

          <MaquinaInput
            name="machineName"
            label="Modelo"
            error={machineNameError}
            required
            maxInputLength={30}
            value={machineName}
            onChange={(e) => {
              setMachineName(stripEmoji(e.target.value));
              setMachineNameError(null);
            }}
          />
          <MaquinaInput
            name="machineNickname"
            label="Apodo"
            error={machineNicknameError}
            required
            maxInputLength={30}
            value={machineNickname}
            onChange={(e) => {
              setMachineNickname(stripEmoji(e.target.value));
              setMachineNicknameError(null);
            }}
          />

          <div className="flex flex-col text-[13px] text-[#575757] mb-6">
            <label className="font-medium">
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

          <MaquinaInput
            name="machineDescription"
            label="Descripción"
            longText
            placeholderLongText="Área de trabajo o especificaciones de la máquina"
            maxInputLength={200}
            value={machineDescription}
            onChange={(e) => setMachineDescription(stripEmoji(e.target.value))}
          />

          <div className="flex flex-col text-[13px] text-[#575757] mb-6">
            <label className="font-medium">Sucursal</label>
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

          <div className="flex flex-col text-[13px] text-[#575757] mb-6">
            <label className="font-medium">Servicios</label>
            <MultiSelect
              options={servicioOptions}
              value={selectedServicios}
              onChange={setSelectedServicios}
              placeholder="Seleccionar servicios..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
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
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
