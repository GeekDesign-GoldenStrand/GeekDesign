"use client";

import { useState } from "react";

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

const SELECT_FIELD =
  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] bg-white transition-colors";
const LABEL = "block text-[13px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

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
        <select
          id="asignar-sucursal-select"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            if (error) setError("");
          }}
          className={`${SELECT_FIELD} ${error ? "border-[#e42200]" : ""}`}
          disabled={loading}
        >
          <option value="">Seleccionar sucursal</option>
          {sucursales.map((s) => (
            <option key={s.id_sucursal} value={s.id_sucursal}>
              {s.nombre_sucursal}
            </option>
          ))}
        </select>
        {error && <p className={ERROR_MSG}>{error}</p>}
      </div>

      <div className="flex justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-[14px] font-medium text-white bg-[rgba(0,106,255,0.85)] rounded-[7px] hover:bg-[#006aff] transition-colors disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Asignar"}
        </button>
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-[20px] font-medium text-[#1e1e1e]">Asignar sucursal</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8e908f] hover:text-[#e42200] transition-colors"
            aria-label="Cerrar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

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
      </div>
    </div>
  );
}
