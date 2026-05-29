"use client";

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
import type { NuevoServicioFormState } from "@/types/servicios";

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
    options,
    actions,
  } = useServicioForm(hookOptions);

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
    ? mode === "edit"
      ? "Guardando..."
      : "Guardando..."
    : mode === "edit"
      ? "Guardar Cambios"
      : "Guardar servicio";

  return (
    <form
      onSubmit={actions.handleSubmit}
      className="bg-white rounded-2xl shadow-[0px_4px_7px_0px_rgba(0,0,0,0.10)] p-8 space-y-6"
    >
      {/* Row 1: Nombre + Sucursal */}
      <div className="grid grid-cols-2 gap-6">
        <Input
          label="Nombre del servicio:"
          required
          value={form.nombre_servicio}
          onChange={(e) => actions.updateField("nombre_servicio", e.target.value)}
          placeholder="Ej. Corte Láser"
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
        onChange={(e) => actions.updateField("descripcion_servicio", e.target.value)}
        placeholder="Describe brevemente el servicio (opcional)"
        maxLength={500}
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
      <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
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

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
          {submitError}
        </div>
      )}

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
