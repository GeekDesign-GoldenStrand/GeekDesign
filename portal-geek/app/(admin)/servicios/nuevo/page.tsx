"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MaquinasSelector } from "@/components/admin/servicios/molecules/MaquinasSelector";
import { InstaladorToggle } from "@/components/admin/servicios/molecules/InstaladorToggle";
import { SucursalSelector } from "@/components/admin/servicios/molecules/SucursalSelector";

import { Button, Input, Textarea } from "@/components/admin/forms/atoms";
import { useFetch } from "@/lib/hooks/useFetch";
import type {
  InstaladorOption,
  MaquinaOption,
  ProveedorOption,
  SucursalOption,
  TipoVariableOption,
} from "@/types/servicios";

// ─── Form State ──────────────────────

type FormState = {
  nombre_servicio: string;
  descripcion_servicio: string;
  id_sucursal: number | null;
  id_maquinas: number[];
  id_instalador: number | null;
  costo_instalador_override: number | null;
  // To be: id_proveedor, formula, etc.
};

const initialState: FormState = {
  nombre_servicio: "",
  descripcion_servicio: "",
  id_sucursal: null,
  id_maquinas: [],
  id_instalador: null,
  costo_instalador_override: null,
};

// ─── Main Component ───────────────────────────────────

export default function NuevoServicioPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Static option fetches (load once on mount).
  const sucursales = useFetch<{ data: SucursalOption[] }>(
    "/api/sucursales?mode=options"
  );
  const instaladores = useFetch<{ data: InstaladorOption[] }>("/api/instaladores");
  const proveedores = useFetch<{ data: ProveedorOption[] }>(
    "/api/proveedores?mode=options"
  );
  const tiposVariable = useFetch<TipoVariableOption[]>("/api/tipos-variable");

  // Branch-scoped fetch: only fires when a branch is chosen.
  // The URL changes when id_sucursal changes, which triggers a refetch
  // automatically (useFetch has [url] as effect dep).
  const maquinasUrl =
    form.id_sucursal !== null
      ? `/api/maquinas?sucursal=${form.id_sucursal}`
      : null;
  const maquinas = useFetch<{ data: MaquinaOption[] }>(maquinasUrl);

  // Generic helper for simple field updates.
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Special handler for branch changes: warn the admin if they have machines
  // selected, since changing branch invalidates them.
  function handleSucursalChange(newId: number | null) {
    const hasSelectedMachines = form.id_maquinas.length > 0;
    const isActuallyChanging = newId !== form.id_sucursal;

    if (hasSelectedMachines && isActuallyChanging) {
      const confirmed = window.confirm(
        "Cambiar de sucursal borrará las máquinas seleccionadas. ¿Continuar?"
      );
      if (!confirmed) return;
    }

    setForm((prev) => ({
      ...prev,
      id_sucursal: newId,
      // Clear machines whenever the branch changes.
      id_maquinas: [],
    }));
  }

  // Submit handler.
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
          id_sucursal: form.id_sucursal,
          estatus_servicio: true,
          id_maquinas: form.id_maquinas,
          id_instalador: form.id_instalador,
          costo_instalador_override: form.costo_instalador_override
          // To be: id_proveedor, formula
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

  // Initial load: wait for the always-required fetches.
  // Machines are NOT in here — they only load after branch is picked.
  const initialLoading =
    sucursales.loading ||
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

  const fetchError =
    sucursales.error ||
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

  // Submit is enabled only when required fields are present.
  const canSubmit =
    form.nombre_servicio.trim().length > 0 && form.id_sucursal !== null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-[#1e1e1e] mb-6">
        Registrar nuevo servicio
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-[0px_4px_7px_0px_rgba(0,0,0,0.10)] p-8 space-y-6"
      >
        {/* Basic data */}
        <div className="grid grid-cols-2 gap-6">
          <Input
            label="Nombre del servicio"
            required
            value={form.nombre_servicio}
            onChange={(e) => updateField("nombre_servicio", e.target.value)}
            placeholder="Ej. Corte Láser"
            maxLength={100}
          />

          <SucursalSelector
            opciones={sucursales.data?.data ?? []}
            selectedId={form.id_sucursal}
            onChange={handleSucursalChange}
            disabled={submitting}
          />
        </div>

        <Textarea
          label="Descripción"
          value={form.descripcion_servicio}
          onChange={(e) => updateField("descripcion_servicio", e.target.value)}
          placeholder="Describe brevemente el servicio (opcional)"
          maxLength={500}
        />

        {/* Branch-dependent and entity-linking sections */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <MaquinasSelector
            opciones={maquinas.data?.data ?? []}
            selectedIds={form.id_maquinas}
            onChange={(ids) => updateField("id_maquinas", ids)}
            hasSucursal={form.id_sucursal !== null}
            loading={maquinas.loading}
          />

         <InstaladorToggle
            opciones={instaladores.data?.data ?? []}
            value={{
              id: form.id_instalador,
              costoOverride: form.costo_instalador_override,
            }}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                id_instalador: v.id,
                costo_instalador_override: v.costoOverride,
              }))
            }
          />

          <div className="text-sm text-gray-400 italic">Proveedor</div>
          <div className="text-sm text-gray-400 italic">
            Variables y constantes
          </div>
        </div>

        <div className="text-sm text-gray-400 italic pt-4 border-t border-gray-200">
          Constructor de fórmula
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
            {submitError}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !canSubmit}
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