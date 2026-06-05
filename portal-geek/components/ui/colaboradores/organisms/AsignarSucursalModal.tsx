"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/atoms";
import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";

interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
}

interface AsignarSucursalModalProps {
  isOpen: boolean;
  colaboradorId: number | null;
  colaboradorName: string;
  currentSucursalId: number | null;
  sucursales: Sucursal[];
  loading: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (idSucursal: number) => void;
}

const LABEL = "block text-[13px] font-medium text-[#575757] mb-1";

function AsignarSucursalForm({
  colaboradorName,
  currentSucursalId,
  sucursales,
  loading,
  serverError,
  onClose,
  onSubmit,
}: {
  colaboradorName: string;
  currentSucursalId: number | null;
  sucursales: Sucursal[];
  loading: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (idSucursal: number) => void;
}) {
  const [selected, setSelected] = useState<string>(
    currentSucursalId != null ? String(currentSucursalId) : ""
  );
  const [error, setError] = useState<string>("");

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) {
      setError("Selecciona una sucursal.");
      return;
    }
    const id = Number(selected);
    if (id === currentSucursalId) {
      onClose();
      return;
    }
    onSubmit(id);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="p-6 flex flex-col gap-4">
      <p className="text-[14px] text-[#575757]">
        Selecciona la sucursal para{" "}
        <span className="font-medium text-[#1e1e1e]">{colaboradorName}</span>.
      </p>

      {serverError && (
        <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="asignar-sucursal-select" className={LABEL}>
          Sucursal <span className="text-[#e42200]">*</span>
        </label>
        <Select
          id="asignar-sucursal-select"
          value={selected}
          onChange={(v) => {
            setSelected(v);
            if (error) setError("");
          }}
          placeholder="Seleccionar sucursal"
          size="sm"
          disabled={loading}
          error={error || undefined}
        >
          {sucursales.map((s) => (
            <SelectOption key={s.id_sucursal} value={String(s.id_sucursal)}>
              {s.nombre_sucursal}
            </SelectOption>
          ))}
        </Select>
      </div>

      <div className="flex justify-end gap-3 mt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={loading}>
          {loading ? "Guardando..." : "Asignar"}
        </Button>
      </div>
    </form>
  );
}

export function AsignarSucursalModal({
  isOpen,
  colaboradorId,
  colaboradorName,
  currentSucursalId,
  sucursales,
  loading,
  serverError,
  onClose,
  onSubmit,
}: AsignarSucursalModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar sucursal" size="lg" noPadding>
      <AsignarSucursalForm
        key={colaboradorId ?? "none"}
        colaboradorName={colaboradorName}
        currentSucursalId={currentSucursalId}
        sucursales={sucursales}
        loading={loading}
        serverError={serverError}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}
