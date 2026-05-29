"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";

import { ActionButton } from "@/components/ui/atoms";
import { EditIcon, TrashIcon, CheckIcon } from "@/components/ui/atoms/icons";

interface SucursalStatusDropdownProps {
  status: string;
  options: string[];
  onChange: (newStatus: string) => void;
  saving?: boolean;
}

const STATUS_CONFIGS: Record<string, { color: string; bg: string }> = {
  Activo: { color: "#2A940D", bg: "rgba(204, 255, 165, 0.07)" },
  Inactivo: { color: "#FF0000", bg: "rgba(255, 165, 165, 0.07)" },
};

const DEFAULT_STATUS_CFG = { color: "#8e908f", bg: "rgba(142,144,143,0.07)" };

export function SucursalStatusDropdown({
  status,
  options,
  onChange,
  saving = false,
}: SucursalStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIGS[status] ?? DEFAULT_STATUS_CFG;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        disabled={saving}
        onClick={() => !saving && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="inline-flex min-h-[30px] items-center justify-between gap-1 rounded-[7px] px-2 shadow-[0_4px_10px_rgba(0,0,0,0.25)] disabled:cursor-default"
        style={{ border: `1px solid ${cfg.color}`, backgroundColor: cfg.bg }}
      >
        <span
          className="font-ibm-plex text-[14px] font-medium leading-none"
          style={{ color: cfg.color }}
        >
          {saving ? "..." : status}
        </span>
        <CaretRight size={8} color={cfg.color} weight="bold" aria-hidden />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 z-50 flex flex-col gap-2 rounded-[7px] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.18)]"
          style={{ minWidth: "110px" }}
        >
          {options.map((option) => {
            const ocfg = STATUS_CONFIGS[option] ?? DEFAULT_STATUS_CFG;
            return (
              <li key={option} role="option" aria-selected={option === status}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className="w-full flex min-h-[30px] items-center justify-center rounded-[7px] px-3 font-ibm-plex font-medium text-[12px] transition-opacity hover:opacity-80"
                  style={{
                    border: `1px solid ${ocfg.color}`,
                    backgroundColor: option === status ? ocfg.bg : "transparent",
                    color: ocfg.color,
                  }}
                >
                  {option}
                  {option === status && <CheckIcon size={15} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export interface SucursalCardProps {
  id: number;
  nombre_sucursal: string;
  direccion: string;
  horario_apertura?: string | null;
  horario_salida?: string | null;
  estatus: string;
  colaboradores?: string[];
  maquinas?: string[];
  onDelete: () => void;
  onEdit: () => void;
  onChangeStatus?: (newStatus: string) => void;
}

function formatHour(dateString?: string | null) {
  if (!dateString) return "—";
  // The backend returns schedule strings as ISO strings. We format them using UTC.
  try {
    return new Date(dateString).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
  } catch {
    return dateString;
  }
}

export function SucursalCard({
  nombre_sucursal,
  direccion,
  horario_apertura,
  horario_salida,
  estatus,
  colaboradores = [],
  maquinas = [],
  onDelete,
  onEdit,
  onChangeStatus,
}: SucursalCardProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (!onChangeStatus) return;
    setIsChangingStatus(true);
    try {
      await onChangeStatus(newStatus);
    } finally {
      setIsChangingStatus(false);
    }
  }

  return (
    <div className="bg-white gap-4 rounded-[7px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.25)] p-4 flex flex-col w-full min-w-0 font-['IBM_Plex_Sans_JP',sans-serif]">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-ibm-plex font-semibold text-[#1e1e1e] break-words">
          {nombre_sucursal}
        </h1>
        <p className="text-[16px] font-IBM-plex-sans font-medium text-[#1e1e1e] mt-1 break-words">
          {direccion}
        </p>
      </div>

      {/* Schedules */}
      <div>
        <p className="text-[16px] font-IBM-plex-sans font-medium text-[#1e1e1e] mb-1">Horario</p>
        <p className="text-[14px] font-IBM-plex-sans font-normal text-[#1e1e1e]">
          {formatHour(horario_apertura)} - {formatHour(horario_salida)}
        </p>
      </div>

      {/* Colaboradores */}
      <div>
        <p className="text-[16px] font-IBM-plex-sans font-medium text-[#1e1e1e] mb-1">
          Colaboradores
        </p>
        {colaboradores.length > 0 ? (
          <div className="flex flex-wrap gap-2 flex-1">
            {colaboradores.map((colab, idx) => (
              <p
                key={idx}
                className="border border-gray-400 bg-gray-100 text-xs w-fit max-w-full h-fit font-regular px-2 py-1 rounded-lg text-[#1e1e1e] break-words"
              >
                {colab}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[14px] font-IBM-plex-sans font-normal text-[#1e1e1e]">
            Sin colaboradores asignados
          </p>
        )}
      </div>

      {/* Máquinas */}
      <div>
        <p className="text-[16px] font-IBM-plex-sans font-medium text-[#1e1e1e] mb-1">Máquinas</p>
        {maquinas.length > 0 ? (
          <div className="flex flex-wrap gap-2 flex-1">
            {maquinas.map((maq, idx) => (
              <p
                key={idx}
                className="border border-gray-400 bg-gray-100 text-xs w-fit max-w-full h-fit font-regular px-2 py-1 rounded-lg text-[#1e1e1e] break-words"
              >
                {maq}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[14px] font-IBM-plex-sans font-normal text-[#1e1e1e]">
            Sin máquinas instaladas
          </p>
        )}
      </div>

      {/* Footer / Status + Actions */}
      <div className="flex items-center justify-end mt-auto pt-3 border-t border-gray-100 flex-wrap gap-2">
        <SucursalStatusDropdown
          status={estatus}
          options={["Activo", "Inactivo"]}
          onChange={handleStatusChange}
          saving={isChangingStatus}
        />
        <ActionButton onClick={onEdit} aria-label="Editar" icon={<EditIcon size={16} />} />
        <ActionButton
          tone="danger"
          onClick={onDelete}
          aria-label="Eliminar"
          icon={<TrashIcon size={16} />}
        />
      </div>
    </div>
  );
}
