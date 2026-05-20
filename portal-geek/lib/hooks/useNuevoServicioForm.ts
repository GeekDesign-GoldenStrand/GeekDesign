"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFetch } from "@/lib/hooks/useFetch";
import { initialNuevoServicioState, type NuevoServicioFormState } from "@/types/servicios";
import type {
  InstaladorOption,
  MaterialDraft,
  MaterialOption,
  MaquinaOption,
  ProveedorOption,
  SucursalOption,
  TipoVariableOption,
} from "@/types/servicios";

export function useNuevoServicioForm() {
  const router = useRouter();

  const [form, setForm] = useState<NuevoServicioFormState>(initialNuevoServicioState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const sucursales = useFetch<{ data: SucursalOption[] }>("/api/sucursales?mode=options");
  const instaladores = useFetch<{ data: InstaladorOption[] }>("/api/instaladores?mode=options");
  const proveedores = useFetch<{ data: ProveedorOption[] }>("/api/proveedores?mode=options");
  const tiposVariable = useFetch<{ data: TipoVariableOption[] }>("/api/tipos-variable");
  const materiales = useFetch<{ data: MaterialOption[] }>("/api/materiales?mode=options");

  const maquinasUrl =
    form.id_sucursal !== null ? `/api/maquinas?sucursal=${form.id_sucursal}` : null;
  const maquinas = useFetch<{ data: MaquinaOption[] }>(maquinasUrl);

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

  function addMaterial(draft: MaterialDraft) {
    setForm((prev) => ({
      ...prev,
      materiales: [...prev.materiales, draft],
    }));
  }

  function removeMaterial(id_material: number) {
    setForm((prev) => ({
      ...prev,
      materiales: prev.materiales.filter((m) => m.id_material !== id_material),
    }));
  }

  function updateMaterialProveedor(id_material: number, id_proveedor_precio: number | null) {
    setForm((prev) => ({
      ...prev,
      materiales: prev.materiales.map((m) =>
        m.id_material === id_material ? { ...m, id_proveedor_precio } : m
      ),
    }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const expresion = form.formulaChunks
        .map((c) => c.value)
        .join("")
        .trim();
      const hasSubstance = form.formulaChunks.some(
        (c) => (c.type === "text" && c.value.trim() !== "") || (c.type === "token" && !c.immutable)
      );
      const formulaPayload =
        hasSubstance && expresion.length > 0
          ? { expresion, variables: form.variables, constantes: form.constantes }
          : undefined;

      const res = await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_servicio: form.nombre_servicio,
          descripcion_servicio: form.descripcion_servicio || undefined,
          id_sucursal: form.id_sucursal,
          estatus_servicio: true,
          id_maquinas: form.id_maquinas,
          id_instalador: form.id_instalador,
          costo_instalador_override: form.costo_instalador_override,
          id_proveedor: form.id_proveedor,
          costo_proveedor_override: form.costo_proveedor_override,
          materiales: form.materialesEnabled ? form.materiales : [],
          formula: formulaPayload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error ?? "Error al crear servicio");
      }

      setSubmitSuccess(true);
      setTimeout(() => router.push("/servicios"), 1500);
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
    tiposVariable.loading ||
    materiales.loading;

  const fetchError =
    sucursales.error || instaladores.error || proveedores.error || tiposVariable.error;

  const canSubmit = form.nombre_servicio.trim().length > 0 && form.id_sucursal !== null;

  return {
    form,
    submitting,
    submitError,
    submitSuccess,
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
      materiales: materiales.data?.data ?? [],
    },
    actions: {
      updateField,
      handleSucursalChange,
      addMaterial,
      removeMaterial,
      updateMaterialProveedor,
      handleSubmit,
      setForm,
      onCancel: () => router.push("/servicios"),
    },
  };
}
