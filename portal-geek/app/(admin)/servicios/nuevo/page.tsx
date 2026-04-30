"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input, Textarea } from "@/components/admin/forms/atoms";
import { useFetch } from "@/lib/hooks/useFetch";
import type {InstaladorOption,MaquinaOption,ProveedorOption,TipoVariableOption,} from "@/types/servicios";

// ─── Forms Status ────────────────────────────────────────────
// Focuses on all the form's fields in one object
// Each section updates its portion of the form state.

type FormState = {
  nombre_servicio: string;
  descripcion_servicio: string;
  // To be: id_maquinas, id_instalador, id_proveedor, formula, etc.
};

const initialState: FormState = {
  nombre_servicio: "",
  descripcion_servicio: "",
};

// ─── Main Component ─────────────────────────────────────────────

export default function NuevoServicioPage() {
  const router = useRouter();

  // Forms State: we keep all the fields in one state object for easier management. 
  // Each section of the form will update its own part of this state.
  const [form, setForm] = useState<FormState>(initialState);

  // Submission state: to handle loading and error during form submission.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load data to the selectors, each one with its own loading and error state. 
  const maquinas = useFetch<{ data: MaquinaOption[] }>("/api/maquinas");
  const instaladores = useFetch<{ data: InstaladorOption[] }>("/api/instaladores");
  const proveedores = useFetch<{ data: ProveedorOption[] }>("/api/proveedores");
  const tiposVariable = useFetch<TipoVariableOption[]>("/api/tipos-variable");

  // Helper to update form fields. It takes the field name and value, and updates the form state accordingly.
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // submit's handler.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_servicio: form.nombre_servicio,
          descripcion_servicio: form.descripcion_servicio || undefined,
          id_estatus: 1, 
          estatus_servicio: true,
          // To be: id_maquinas, id_instalador, id_proveedor, formula
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error ?? "Error al crear servicio");
      }

      router.push("/servicios");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  // While loading the initial data, it shows the global loading indicator.
  const initialLoading =
    maquinas.loading ||
    instaladores.loading ||
    proveedores.loading ||
    tiposVariable.loading;

  if (initialLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">
          Cargando datos del formulario...
        </div>
      </div>
    );
  }

  // If any of the fetches fail, show a global error.
  const fetchError =
    maquinas.error ||
    instaladores.error ||
    proveedores.error ||
    tiposVariable.error;

  if (fetchError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-[#1e1e1e] mb-6">
        Registrar nuevo servicio
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-[0px_4px_7px_0px_rgba(0,0,0,0.10)] p-8 space-y-6"
      >
        {/* Datos basicos */}
        <div className="grid grid-cols-2 gap-6">
          <Input
            label="Nombre del servicio"
            required
            value={form.nombre_servicio}
            onChange={(e) => updateField("nombre_servicio", e.target.value)}
            placeholder="Ej. Corte Láser"
            maxLength={100}
          />
          {/* Espacio para el futuro selector de Sucursal */}
          <div></div>
        </div>

        <Textarea
          label="Descripción"
          value={form.descripcion_servicio}
          onChange={(e) => updateField("descripcion_servicio", e.target.value)}
          placeholder="Describe brevemente el servicio (opcional)"
          maxLength={500}
        />

        {/* Placeholder visible de las secciones que vienen después */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-400 italic">
            Selector de máquinas falta
          </div>
          <div className="text-sm text-gray-400 italic">
            Instalador falta
          </div>
          <div className="text-sm text-gray-400 italic">
            Proveedor 
          </div>
          <div className="text-sm text-gray-400 italic">
            Variables y constantes 
          </div>
        </div>

        <div className="text-sm text-gray-400 italic pt-4 border-t border-gray-200">
          Constructor de fórmula 
        </div>

        {/* Error del submit */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
            {submitError}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !form.nombre_servicio.trim()}
          >
            {submitting ? "Guardando..." : "Guardar servicio"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/servicios")}
            disabled={submitting}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}