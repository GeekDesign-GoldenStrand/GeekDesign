"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/atoms";
import FormInput from "@/components/ui/atoms/FormInput";

interface RegistrarFormProps {
  isOpen: boolean;
  onCreated: (newSucursal: unknown) => void;
  onClose: () => void;
}

function buildSucursalPayload(data: {
  nombre_sucursal: string;
  direccion: string;
  horario_apertura: string;
  horario_salida: string;
  estatus: string;
}) {
  return {
    nombre_sucursal: data.nombre_sucursal,
    direccion: data.direccion,
    horario_apertura: data.horario_apertura
      ? new Date(`1970-01-01T${data.horario_apertura}:00.000Z`).toISOString()
      : null,
    horario_salida: data.horario_salida
      ? new Date(`1970-01-01T${data.horario_salida}:00.000Z`).toISOString()
      : null,
    estatus: data.estatus,
  };
}

export default function RegistrarForm({ isOpen, onCreated, onClose }: RegistrarFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [apertura, setApertura] = useState("09:00");
  const [salida, setSalida] = useState("18:00");
  const [estatus, setEstatus] = useState("Activo");

  const [nombreError, setNombreError] = useState<string | null>(null);
  const [direccionError, setDireccionError] = useState<string | null>(null);

  if (!isOpen) return null;

  function validate(): boolean {
    let valid = true;
    if (nombre.trim().length === 0) {
      setNombreError("El nombre es requerido");
      valid = false;
    } else {
      setNombreError(null);
    }
    if (direccion.trim().length === 0) {
      setDireccionError("La dirección es requerida");
      valid = false;
    } else {
      setDireccionError(null);
    }
    return valid;
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setError(null);
    setIsLoading(true);
    try {
      const payload = buildSucursalPayload({
        nombre_sucursal: nombre,
        direccion,
        horario_apertura: apertura,
        horario_salida: salida,
        estatus,
      });

      const res = await fetch("/api/sucursales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError("Datos inválidos");
        return;
      }

      const json = await res.json();
      // On success, notify parent page to reload/add and close the modal.
      onCreated(json.data);
      window.alert("Sucursal registrada correctamente");
      onClose();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar sucursal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          name="nombre"
          label="Nombre de la sucursal"
          value={nombre}
          error={nombreError}
          placeholder="Ej. Sucursal Centro"
          required
          maxInputLength={100}
          onChange={(e) => setNombre(e.target.value)}
        />

        <FormInput
          name="direccion"
          label="Dirección"
          value={direccion}
          error={direccionError}
          placeholder="Ej. Av. Principal 123, Col. Centro"
          required
          maxInputLength={255}
          onChange={(e) => setDireccion(e.target.value)}
        />

        <FormInput
          name="apertura"
          label="Horario de apertura"
          type="time"
          value={apertura}
          required
          maxInputLength={20}
          onChange={(e) => setApertura(e.target.value)}
        />

        <FormInput
          name="salida"
          label="Horario de salida"
          type="time"
          value={salida}
          required
          maxInputLength={20}
          onChange={(e) => setSalida(e.target.value)}
        />

        <div className="flex flex-col text-[13px] text-[#575757] mb-6">
          <label className="font-medium mb-1">
            Estatus <span className="text-[#e42200]">*</span>
          </label>
          <select
            value={estatus}
            onChange={(e) => setEstatus(e.target.value)}
            className="w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] bg-white transition-colors"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {error && (
          <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px]">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 text-[14px] font-medium text-white bg-[rgba(0,106,255,0.85)] rounded-[7px] hover:bg-[#006aff] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
