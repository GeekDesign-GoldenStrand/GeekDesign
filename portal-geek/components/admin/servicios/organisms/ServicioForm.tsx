"use client";

import { useEffect, useRef } from "react";

import { Input, Textarea } from "@/components/admin/forms/atoms";
import { ConstantesSection } from "@/components/admin/servicios/molecules/ConstantesSection";
import { FormulaSection } from "@/components/admin/servicios/molecules/FormulasSection";
import { InstaladorToggle } from "@/components/admin/servicios/molecules/InstaladorToggle";
import { MaquinasSelector } from "@/components/admin/servicios/molecules/MaquinasSelector";
import { MaterialesSection } from "@/components/admin/servicios/molecules/MaterialesSection";
import { ProveedorToggle } from "@/components/admin/servicios/molecules/ProveedorToggle";
import { SucursalSelector } from "@/components/admin/servicios/molecules/SucursalSelector";
import { VariablesSection } from "@/components/admin/servicios/molecules/VariablesSection";
import { Button } from "@/components/ui/atoms/Button";
import { SuccessModal } from "@/components/ui/atoms/SuccessModal";
import { ImageUploader } from "@/components/ui/molecules/ImageUploader";
import type { UseServicioFormOptions } from "@/lib/hooks/useServicioForm";
import { useServicioForm } from "@/lib/hooks/useServicioForm";
import { sanitizeUserText } from "@/lib/utils/safe-text";
import { stripUiOnlyConstants } from "@/lib/utils/servicio-mappers";
import type { NuevoServicioFormState } from "@/types/servicios";

// ── Error parsing ──────────────────────────────────────────────────────────────
// handleError serialises Zod issues as "path.to.field: message, path2: message2".
// We split only on ", " boundaries followed by another dotted path so commas
// inside message text (e.g. "No puede usarse: precio_material, costo_instalador")
// are not treated as issue separators.

type SectionErrors = {
  general: string | null;
  formula: string[];
  variables: string[];
  constantes: string[];
};

const ZOD_BOUNDARY = /, (?=[a-z_][\w]*(?:\.[\w]+)*: )/;

const ZOD_HUMAN: Record<string, string> = {
  "String must contain at least 1 character(s)": "Este campo es requerido",
  Required: "Este campo es requerido",
  "Number must be greater than or equal to 0": "El valor debe ser cero o mayor",
  "Expected number, received nan": "Ingresa un número válido",
};

function humanizeMessage(msg: string): string {
  return ZOD_HUMAN[msg] ?? msg;
}

function parseSubmitError(
  raw: string | null,
  varDrafts: Array<{ nombre_variable: string }>,
  constDrafts: Array<{ nombre_constante: string }>
): SectionErrors {
  const empty: SectionErrors = { general: null, formula: [], variables: [], constantes: [] };
  if (!raw) return empty;

  // Pre-flight formula errors are plain sentences (no Zod path prefix).
  if (/fórmula/i.test(raw) && !/^formula\./.test(raw)) {
    return { ...empty, formula: [raw] };
  }

  const parts = raw.split(ZOD_BOUNDARY);
  const generalBucket: string[] = [];
  const formulaBucket: string[] = [];
  const variablesBucket: string[] = [];
  const constantesBucket: string[] = [];

  for (const part of parts) {
    const colonIdx = part.indexOf(": ");
    if (colonIdx === -1 || !/^[a-z_][\w]*(?:\.[\w]+)*$/.test(part.slice(0, colonIdx))) {
      generalBucket.push(part);
      continue;
    }
    const path = part.slice(0, colonIdx);
    const human = humanizeMessage(part.slice(colonIdx + 2).trim());

    const varMatch = path.match(/^formula\.variables\.(\d+)\./);
    const constMatch = path.match(/^formula\.constantes\.(\d+)\./);

    if (varMatch) {
      const name = varDrafts[parseInt(varMatch[1], 10)]?.nombre_variable;
      variablesBucket.push(name ? `Variable "${name}": ${human}` : human);
    } else if (constMatch) {
      const name = constDrafts[parseInt(constMatch[1], 10)]?.nombre_constante;
      constantesBucket.push(name ? `Constante "${name}": ${human}` : human);
    } else if (/^formula/.test(path)) {
      formulaBucket.push(human);
    } else {
      generalBucket.push(part);
    }
  }

  const dedup = (arr: string[]) => [...new Set(arr)];
  return {
    general: generalBucket.join("; ") || null,
    formula: dedup(formulaBucket),
    variables: dedup(variablesBucket),
    constantes: dedup(constantesBucket),
  };
}

function SectionError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-md text-sm"
    >
      {message}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

type ServicioFormProps =
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

export function ServicioForm(props: ServicioFormProps) {
  const { mode } = props;
  const hookOptions: UseServicioFormOptions =
    props.mode === "edit"
      ? {
          mode: props.mode,
          initialData: props.initialData,
          servicioId: props.servicioId,
          onSuccess: props.onSuccess,
          onCancel: props.onCancel,
        }
      : {
          mode: props.mode,
          initialData: props.initialData,
          onSuccess: props.onSuccess,
          onCancel: props.onCancel,
        };

  const {
    form,
    submitting,
    submitError,
    submitSuccess,
    initialLoading,
    fetchError,
    canSubmit,
    missingRequirements,
    options,
    actions,
  } = useServicioForm(hookOptions);

  const errors = parseSubmitError(
    submitError,
    form.variables,
    stripUiOnlyConstants(form.constantes)
  );

  // Scroll the general error banner into view when it appears — section-level
  // errors (formula / variables / constantes) are inline so no scroll needed.
  const generalErrorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errors.general) {
      generalErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errors.general]);

  if (initialLoading) {
    return <div className="text-center py-12 text-gray-500">Cargando datos del formulario...</div>;
  }

  if (fetchError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        {fetchError}
      </div>
    );
  }

  const submitLabel = submitting
    ? "Guardando..."
    : mode === "edit"
      ? "Guardar Cambios"
      : "Guardar servicio";

  return (
    <form
      onSubmit={actions.handleSubmit}
      className="bg-white rounded-2xl shadow-[0px_4px_7px_0px_rgba(0,0,0,0.10)] p-8 space-y-6"
    >
      {errors.general && (
        <div ref={generalErrorRef}>
          <SectionError message={errors.general} />
        </div>
      )}

      {missingRequirements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
          <p className="font-medium text-amber-900 mb-1">Para guardar este servicio, completa:</p>
          <ul className="list-disc list-inside text-amber-800 space-y-0.5">
            {missingRequirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Row 1: Nombre + Apodo + Sucursal */}
      <div className="grid grid-cols-3 gap-6">
        <Input
          label="Nombre del servicio:"
          required
          value={form.nombre_servicio}
          onChange={(e) => actions.updateField("nombre_servicio", sanitizeUserText(e.target.value))}
          placeholder="Ej. Corte Láser"
          maxLength={100}
        />

        <Input
          label="Apodo del servicio:"
          required
          value={form.apodo_servicio}
          onChange={(e) => actions.updateField("apodo_servicio", sanitizeUserText(e.target.value))}
          placeholder="Ej. Corte CO2"
          maxLength={100}
        />

        <SucursalSelector
          opciones={options.sucursales}
          selectedId={form.id_sucursal}
          onChange={actions.handleSucursalChange}
          disabled={submitting}
        />
      </div>

      {/* Row 2: Descripción */}
      <Textarea
        label="Descripción:"
        value={form.descripcion_servicio}
        onChange={(e) =>
          actions.updateField("descripcion_servicio", sanitizeUserText(e.target.value))
        }
        placeholder="Describe brevemente el servicio (opcional)"
        maxLength={350}
      />

      {/* Row 2.5: Imágenes */}
      <div className="pt-4 border-t border-gray-200">
        <ImageUploader
          mode="multi"
          category="servicios"
          label="Imágenes del servicio:"
          maxFiles={5}
          initialKeys={form.imagenes}
          onKeysChange={(keys) => actions.updateField("imagenes", keys)}
          onError={(msg) => actions.setSubmitError(msg)}
          disabled={submitting}
        />
      </div>

      {/* Row 3: Instalador | Proveedor | Máquinas */}
      <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
        <InstaladorToggle
          opciones={options.instaladores}
          value={{ id: form.id_instalador, costoOverride: form.costo_instalador_override }}
          onChange={(v) =>
            actions.setForm((prev) => ({
              ...prev,
              id_instalador: v.id,
              costo_instalador_override: v.costoOverride,
            }))
          }
        />
        <ProveedorToggle
          opciones={options.proveedores}
          value={{ id: form.id_proveedor, costoOverride: form.costo_proveedor_override }}
          onChange={(v) =>
            actions.setForm((prev) => ({
              ...prev,
              id_proveedor: v.id,
              costo_proveedor_override: v.costoOverride,
            }))
          }
        />
        <MaquinasSelector
          opciones={options.maquinas}
          selectedIds={form.id_maquinas}
          onChange={(ids) => actions.updateField("id_maquinas", ids)}
          hasSucursal={form.id_sucursal !== null}
          loading={options.maquinasLoading}
        />
      </div>

      {/* Row 4: Materiales */}
      <div className="pt-4 border-t border-gray-200">
        <MaterialesSection
          enabled={form.materialesEnabled}
          onToggle={(enabled) => actions.updateField("materialesEnabled", enabled)}
          materiales={form.materiales}
          opcionesMateriales={options.materiales}
          onAdd={actions.addMaterial}
          onRemove={actions.removeMaterial}
          onUpdateProveedor={actions.updateMaterialProveedor}
        />
      </div>

      {/* Row 5: Fórmula | Variables | Constantes */}
      <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
        {(errors.formula.length > 0 ||
          errors.variables.length > 0 ||
          errors.constantes.length > 0) && (
          <div className="flex flex-col gap-2">
            {errors.formula.map((msg, i) => (
              <SectionError key={i} message={msg} />
            ))}
            {errors.variables.map((msg, i) => (
              <SectionError key={i} message={msg} />
            ))}
            {errors.constantes.map((msg, i) => (
              <SectionError key={i} message={msg} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-6">
          <FormulaSection
            chunks={form.formulaChunks}
            onChunksChange={(chunks) => actions.updateField("formulaChunks", chunks)}
            variables={form.variables}
            constantes={form.constantes}
            idInstalador={form.id_instalador}
            idProveedor={form.id_proveedor}
            materiales={form.materiales}
            opcionesMateriales={options.materiales}
          />
          <VariablesSection
            tiposDisponibles={options.tiposVariable}
            variables={form.variables}
            onChange={(v) => actions.updateField("variables", v)}
          />
          <ConstantesSection
            tiposDisponibles={options.tiposVariable}
            constantes={form.constantes}
            onChange={(c) => actions.updateField("constantes", c)}
          />
        </div>
      </div>

      {submitSuccess && (
        <SuccessModal
          message={
            mode === "edit"
              ? "Servicio actualizado correctamente."
              : "Servicio registrado correctamente. Redirigiendo..."
          }
          onClose={actions.onSuccessRedirect}
        />
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200 justify-end">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={submitting || submitSuccess || !canSubmit}
          loading={submitting}
        >
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={actions.onCancel}
          disabled={submitting || submitSuccess}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
