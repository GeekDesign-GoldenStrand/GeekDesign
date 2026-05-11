"use client";

interface Rol { id_rol: number; nombre_rol: string; }

interface FiltrarColaboradoresPanelProps {
  roles: Rol[];
  filterEstatus: string;
  filterRoles: number[];
  onEstatusChange: (v: string) => void;
  onRolToggle: (id: number) => void;
  onReset: () => void;
  onClose: () => void;
}

const ESTATUS_OPTIONS = [
  { label: "Todos",    value: "" },
  { label: "Activo",   value: "Activo" },
  { label: "Inactivo", value: "Inactivo" },
];

export function FiltrarColaboradoresPanel({
  roles,
  filterEstatus,
  filterRoles,
  onEstatusChange,
  onRolToggle,
  onReset,
  onClose,
}: FiltrarColaboradoresPanelProps) {
  return (
    <div className="absolute top-full right-0 mt-2 z-50 w-[21rem] rounded-[14px] border-4 border-[#ff7f7f] bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
      <div className="flex gap-5">
        <section className="flex-1 min-w-0">
          <p className="text-[24px] leading-none font-semibold text-[#1e1e1e] mb-2">Estado</p>
          <div className="space-y-1.5">
            {ESTATUS_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
                <input
                  type="radio"
                  name="colab-estatus"
                  checked={filterEstatus === opt.value}
                  onChange={() => onEstatusChange(opt.value)}
                  className="h-3.5 w-3.5 accent-[#ff7f7f]"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>

        <section className="w-[9rem]">
          <p className="text-[24px] leading-none font-semibold text-[#1e1e1e] mb-2">Rol</p>
          <div className="space-y-1.5">
            {roles.map((r) => (
              <label key={r.id_rol} className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterRoles.includes(r.id_rol)}
                  onChange={() => onRolToggle(r.id_rol)}
                  className="h-3.5 w-3.5 accent-[#ff7f7f]"
                />
                {r.nombre_rol}
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={onReset}
          className="h-7 px-3 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
        >
          Restablecer
        </button>
        <button
          onClick={onClose}
          className="h-7 px-6 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
