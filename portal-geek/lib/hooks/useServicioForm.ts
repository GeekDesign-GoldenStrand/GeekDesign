"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useFetch } from "@/lib/hooks/useFetch";
import { hasCharRun, repeatedWords } from "@/lib/utils/safe-text";
import { stripUiOnlyConstants } from "@/lib/utils/servicio-mappers";
import { deleteFile } from "@/lib/utils/upload";
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

export type ServicioFormMode = "create" | "edit";

export type UseServicioFormOptions =
  | {
      mode: "create";
      initialData?: NuevoServicioFormState;
      servicioId?: never;
      onSuccess?: () => void;
      onCancel?: () => void;
    }
  | {
      mode: "edit";
      initialData?: NuevoServicioFormState;
      servicioId: number;
      onSuccess?: () => void;
      onCancel?: () => void;
    };

export function useServicioForm({
  mode,
  initialData,
  servicioId,
  onSuccess,
  onCancel,
}: UseServicioFormOptions) {
  const router = useRouter();

  const [form, setForm] = useState<NuevoServicioFormState>(
    initialData ?? initialNuevoServicioState
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Snapshot of the images that were already persisted on the servicio when the
  // form mounted. Used by the submit-failure cleanup to delete only the keys
  // uploaded *during this session*, leaving server-owned keys untouched. On
  // create this is [], so the diff equals "everything uploaded this session".
  const initialImagenes = useRef<string[]>(initialData?.imagenes ?? []);

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
    if (submitError && (key === "variables" || key === "constantes" || key === "formulaChunks")) {
      setSubmitError(null);
    }
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
    setForm((prev) => ({ ...prev, materiales: [...prev.materiales, draft] }));
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
    if (mode === "edit" && servicioId === undefined) {
      setSubmitError("Error interno: servicioId es requerido en modo edición.");
      return;
    }

    // Pre-flight spam check on the descriptive fields. Run before setSubmitting
    // so a validation error doesn't trigger the image-cleanup path in the catch.
    if (hasCharRun(form.nombre_servicio)) {
      setSubmitError("El nombre del servicio tiene letras repetidas sin coherencia.");
      return;
    }
    if (repeatedWords(form.nombre_servicio)) {
      setSubmitError("El nombre del servicio repite la misma palabra varias veces.");
      return;
    }
    if (hasCharRun(form.apodo_servicio)) {
      setSubmitError("El apodo del servicio tiene letras repetidas sin coherencia.");
      return;
    }
    if (repeatedWords(form.apodo_servicio)) {
      setSubmitError("El apodo del servicio repite la misma palabra varias veces.");
      return;
    }
    if (form.descripcion_servicio.trim()) {
      if (hasCharRun(form.descripcion_servicio)) {
        setSubmitError("La descripción tiene letras repetidas sin coherencia.");
        return;
      }
      if (repeatedWords(form.descripcion_servicio)) {
        setSubmitError("La descripción repite la misma palabra varias veces.");
        return;
      }
    }

    // Reject adjacent tokens with no binary operator between them. Without this
    // the chunks "ancho" + "" + "iva" serialize as "anchoiva" which the parser
    // either rejects or evaluates against the wrong identifier. Tokens at odd
    // indices, text chunks at even — for every neighboring token pair we
    // require at least one of + - * / in the text chunk between them.
    for (let i = 1; i < form.formulaChunks.length - 2; i += 2) {
      const current = form.formulaChunks[i];
      const between = form.formulaChunks[i + 1];
      const next = form.formulaChunks[i + 2];
      if (current.type !== "token" || next.type !== "token") continue;
      if (!/[+\-*/]/.test(between.value)) {
        setSubmitError(
          `Falta un operador (+, -, * o /) entre "${current.value}" y "${next.value}" en la fórmula.`
        );
        return;
      }
    }

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
      const constantesPayload = stripUiOnlyConstants(form.constantes);
      const formulaPayload =
        hasSubstance && expresion.length > 0
          ? { expresion, variables: form.variables, constantes: constantesPayload }
          : undefined;

      const url = mode === "edit" ? `/api/servicios/${servicioId}` : "/api/servicios";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_servicio: form.nombre_servicio.trim(),
          apodo_servicio: form.apodo_servicio.trim(),
          descripcion_servicio: form.descripcion_servicio.trim() || undefined,
          id_sucursal: form.id_sucursal,
          estatus_servicio: true,
          imagenes: form.imagenes,
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
        throw new Error(
          errorData?.error ?? `Error al ${mode === "edit" ? "actualizar" : "crear"} servicio`
        );
      }

      setSubmitSuccess(true);
    } catch (err) {
      // Drop only the keys uploaded in this session (form.imagenes minus the
      // initial snapshot). Server-owned images stay intact on edit; on create
      // the snapshot is [] so the diff is "everything uploaded this session".
      if (form.imagenes.length > 0) {
        const sessionKeys = form.imagenes.filter((key) => !initialImagenes.current.includes(key));
        sessionKeys.forEach((key) => {
          void deleteFile(key).catch(() => {});
        });
        setForm((prev) => ({ ...prev, imagenes: initialImagenes.current }));
      }
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
    sucursales.error ||
    instaladores.error ||
    proveedores.error ||
    tiposVariable.error ||
    maquinas.error ||
    materiales.error;

  // A servicio is only saveable when every required piece is in place. The
  // full requirements set is enforced only on CREATE — on EDIT we relax to
  // what the backend schema actually requires (nombre + sucursal). Otherwise
  // existing services that lack one of the optional pieces (e.g. only 1 image,
  // no formula yet) get locked out of any further edits, which surfaced as
  // "I added a máquina and can't save" bug.
  const missingRequirements: string[] = [];
  if (form.nombre_servicio.trim().length === 0) {
    missingRequirements.push("Nombre del servicio");
  }
  if (form.apodo_servicio.trim().length === 0) {
    missingRequirements.push("Apodo del servicio");
  }
  if (form.id_sucursal === null) {
    missingRequirements.push("Sucursal");
  }
  if (mode === "create") {
    if (form.id_maquinas.length === 0) {
      missingRequirements.push("Al menos una máquina");
    }
    if (form.materiales.length === 0) {
      missingRequirements.push("Al menos un material");
    }
    if (form.imagenes.length < 2) {
      missingRequirements.push(`Al menos 2 imágenes (tienes ${form.imagenes.length})`);
    }
    const hasFormulaSubstance = form.formulaChunks.some(
      (c) => (c.type === "text" && c.value.trim() !== "") || (c.type === "token" && !c.immutable)
    );
    if (!hasFormulaSubstance) {
      missingRequirements.push("Fórmula");
    }
  }
  const canSubmit = missingRequirements.length === 0;

  const defaultCancel = () => router.push("/servicios");
  const defaultSuccessRedirect = () => router.push("/servicios");

  return {
    form,
    submitting,
    submitError,
    submitSuccess,
    initialLoading,
    fetchError,
    canSubmit,
    missingRequirements,
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
      setSubmitError,
      onCancel: onCancel ?? defaultCancel,
      onSuccessRedirect: onSuccess ?? defaultSuccessRedirect,
    },
  };
}
