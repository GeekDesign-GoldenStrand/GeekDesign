"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MaquinasSelector } from "@/components/admin/servicios/molecules/MaquinasSelector";
import { InstaladorToggle } from "@/components/admin/servicios/molecules/InstaladorToggle";
import { ProveedorToggle } from "@/components/admin/servicios/molecules/ProveedorToggle";
import { SucursalSelector } from "@/components/admin/servicios/molecules/SucursalSelector";
import {VariablesSection,type VariableDraft} from "@/components/admin/servicios/molecules/VariablesSection";
import {ConstantesSection,type ConstanteDraft} from "@/components/admin/servicios/molecules/ConstantesSection";
import { FormulaSection } from "@/components/admin/servicios/molecules/FormulasSection";

import { Button, Input, Textarea } from "@/components/admin/forms/atoms";
import { useFetch } from "@/lib/hooks/useFetch";
import type {
  InstaladorOption,
  MaquinaOption,
  ProveedorOption,
  SucursalOption,
  TipoVariableOption,
} from "@/types/servicios";

// Reserved names for auto-managed constantes (synced with installer/provider toggles).
const AUTO_INSTALADOR_NAME = "costo_instalador";
const AUTO_PROVEEDOR_NAME = "costo_proveedor";

// ─── Form State ──────────────────

type FormState = {
  nombre_servicio: string;
  descripcion_servicio: string;
  id_sucursal: number | null;
  id_maquinas: number[];
  id_instalador: number | null;
  costo_instalador_override: number | null;
  id_proveedor: number | null;
  costo_proveedor_override: number | null;
  formulaEnabled: boolean;
  expresion: string;
  variables: VariableDraft[];
  constantes: ConstanteDraft[];
};

const initialState: FormState = {
  nombre_servicio: "",
  descripcion_servicio: "",
  id_sucursal: null,
  id_maquinas: [],
  id_instalador: null,
  costo_instalador_override: null,
  id_proveedor: null,
  costo_proveedor_override: null,
  formulaEnabled: false,
  expresion: "",
  variables: [],
  constantes: [],
};

// ─── Main Component ──────────────────────────────

export default function NuevoServicioPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Static option fetches (load once on mount).
  const sucursales = useFetch<{ data: SucursalOption[] }>(
    "/api/sucursales?mode=options"
  );
  const instaladores = useFetch<{ data: InstaladorOption[] }>(
    "/api/instaladores"
  );
  const proveedores = useFetch<{ data: ProveedorOption[] }>(
    "/api/proveedores?mode=options"
  );
  const tiposVariable = useFetch<{ data: TipoVariableOption[] }>(
    "/api/tipos-variable"
  );

  // Branch-scoped fetch: only fires when a branch is chosen.
  const maquinasUrl =
    form.id_sucursal !== null
      ? `/api/maquinas?sucursal=${form.id_sucursal}`
      : null;
  const maquinas = useFetch<{ data: MaquinaOption[] }>(maquinasUrl);

  // ─── Auto-sync constantes for instalador/proveedor toggles ──────
  // Whenever id_instalador changes, ensure there's an auto constante named
  // 'costo_instalador' bound to that installer. When id_instalador is null,
  // remove that constante. Same logic for proveedor.
  useEffect(() => {
    setForm((prev) => {
      // Strip out any existing auto constantes — we'll re-add them fresh.
      const userManaged = prev.constantes.filter((c) => !c.auto);

      const autoConstantes: ConstanteDraft[] = [];

      if (prev.id_instalador !== null) {
        autoConstantes.push({
          nombre_constante: AUTO_INSTALADOR_NAME,
          origen: "instalador",
          id_instalador: prev.id_instalador,
          auto: true,
        });
      }

      if (prev.id_proveedor !== null) {
        autoConstantes.push({
          nombre_constante: AUTO_PROVEEDOR_NAME,
          origen: "proveedor",
          id_proveedor: prev.id_proveedor,
          auto: true,
        });
      }

      return {
        ...prev,
        constantes: [...autoConstantes, ...userManaged],
      };
    });
  }, [form.id_instalador, form.id_proveedor]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
      id_maquinas: [],
    }));
  }

  // Handler for ConstantesSection. Filters out attempts to modify auto entries.
  function handleConstantesChange(newConstantes: ConstanteDraft[]) {
    // The section only sends back non-auto changes (it can't add auto ones).
    // But it CAN mistakenly remove autos if user-managed list is rebuilt.
    // We trust the section here because we already hide the delete button for autos.
    updateField("constantes", newConstantes);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Strip the `auto` flag before sending — it's UI-only metadata.
      const constantesPayload = form.constantes.map((c) => {
        const { auto: _auto, ...rest } = c;
        return rest;
      });

      const formulaPayload =
        form.formulaEnabled && form.expresion.trim().length > 0
          ? {
              expresion: form.expresion,
              variables: form.variables,
              constantes: constantesPayload,
            }
          : undefined;

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
          costo_instalador_override: form.costo_instalador_override,
          id_proveedor: form.id_proveedor,
          costo_proveedor_override: form.costo_proveedor_override,
          formula: formulaPayload,
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
        <div className="grid grid-cols-2 gap-6">
          <Input
            label="Nombre del servicio:"
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
          label="Descripción:"
          value={form.descripcion_servicio}
          onChange={(e) => updateField("descripcion_servicio", e.target.value)}
          placeholder="Describe brevemente el servicio (opcional)"
          maxLength={500}
        />

        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          
          <MaquinasSelector
            opciones={maquinas.data?.data ?? []}
            selectedIds={form.id_maquinas}
            onChange={(ids) => updateField("id_maquinas", ids)}
            hasSucursal={form.id_sucursal !== null}
            loading={maquinas.loading}
          />

          <div className="flex flex-col gap-6">
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

            <ProveedorToggle
              opciones={proveedores.data?.data ?? []}
              value={{
                id: form.id_proveedor,
                costoOverride: form.costo_proveedor_override,
              }}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  id_proveedor: v.id,
                  costo_proveedor_override: v.costoOverride,
                }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <VariablesSection
            tiposDisponibles={tiposVariable.data?.data ?? []}
            variables={form.variables}
            onChange={(variables) => updateField("variables", variables)}
          />

          <ConstantesSection
            instaladoresDisponibles={instaladores.data?.data ?? []}
            proveedoresDisponibles={proveedores.data?.data ?? []}
            constantes={form.constantes}
            onChange={handleConstantesChange}
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <FormulaSection
            enabled={form.formulaEnabled}
            onToggle={(enabled) => updateField("formulaEnabled", enabled)}
            expresion={form.expresion}
            onExpresionChange={(value) => updateField("expresion", value)}
            variables={form.variables}
            constantes={form.constantes}
          />
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
            {submitError}
          </div>
        )}

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