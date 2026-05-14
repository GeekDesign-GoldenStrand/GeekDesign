"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ConstanteDraft } from "@/components/admin/servicios/molecules/ConstantesSection";
import { useFetch } from "@/lib/hooks/useFetch";
import {
  AUTO_INSTALADOR_NAME,
  AUTO_PROVEEDOR_NAME,
  initialNuevoServicioState,
  type NuevoServicioFormState,
} from "@/types/servicios";
import type {
  InstaladorOption,
  MaquinaOption,
  ProveedorOption,
  SucursalOption,
  TipoVariableOption,
} from "@/types/servicios";

/**
 * Hook that owns all state, side effects, fetches, and submit logic for the
 * "Nuevo servicio" form. The page component just renders what this returns.
 *
 * Returns:
 * - form: current form state
 * - submitting / submitError: submit lifecycle flags
 * - initialLoading / fetchError: option-fetch lifecycle flags
 * - canSubmit: whether the submit button should be enabled
 * - options: pre-resolved option arrays for selectors
 * - actions: handlers the page wires into UI
 */
export function useNuevoServicioForm() {
  const router = useRouter();

  const [form, setForm] = useState<NuevoServicioFormState>(initialNuevoServicioState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Static option fetches (load once on mount).
  const sucursales = useFetch<{ data: SucursalOption[] }>("/api/sucursales?mode=options");
  const instaladores = useFetch<{ data: InstaladorOption[] }>("/api/instaladores?mode=options");
  const proveedores = useFetch<{ data: ProveedorOption[] }>("/api/proveedores?mode=options");
  const tiposVariable = useFetch<{ data: TipoVariableOption[] }>("/api/tipos-variable");

  // Branch-scoped fetch: only fires when a branch is chosen.
  const maquinasUrl =
    form.id_sucursal !== null ? `/api/maquinas?sucursal=${form.id_sucursal}` : null;
  const maquinas = useFetch<{ data: MaquinaOption[] }>(maquinasUrl);

  // Auto-sync: keep "costo_instalador" and "costo_proveedor" constantes in sync
  // with the toggle selections. Strip stale autos before re-adding.
  useEffect(() => {
    setForm((prev) => {
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

      return { ...prev, constantes: [...autoConstantes, ...userManaged] };
    });
  }, [form.id_instalador, form.id_proveedor]);

  function updateField<K extends keyof NuevoServicioFormState>(
    key: K,
    value: NuevoServicioFormState[K]
  ) {
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

    setForm((prev) => ({ ...prev, id_sucursal: newId, id_maquinas: [] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Strip the `auto` UI-only flag before sending to the API.
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
    sucursales.loading || instaladores.loading || proveedores.loading || tiposVariable.loading;

  const fetchError =
    sucursales.error || instaladores.error || proveedores.error || tiposVariable.error;

  const canSubmit = form.nombre_servicio.trim().length > 0 && form.id_sucursal !== null;

  return {
    form,
    submitting,
    submitError,
    initialLoading,
    fetchError,
    canSubmit,
    options: {
      sucursales: sucursales.data?.data ?? [],
      instaladores: instaladores.data?.data ?? [],
      proveedores: proveedores.data?.data ?? [],
      tiposVariable: tiposVariable.data?.data ?? [],
      maquinas: maquinas.data?.data ?? [],
      maquinasLoading: maquinas.loading,
    },
    actions: {
      updateField,
      handleSucursalChange,
      handleSubmit,
      setForm,
      onCancel: () => router.push("/servicios"),
    },
  };
}
