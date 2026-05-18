"use client";

import { Button, Input, Textarea } from "@/components/admin/forms/atoms";
import { ConstantesSection } from "@/components/admin/servicios/molecules/ConstantesSection";
import { FormulaSection } from "@/components/admin/servicios/molecules/FormulasSection";
import { InstaladorToggle } from "@/components/admin/servicios/molecules/InstaladorToggle";
import { MaquinasSelector } from "@/components/admin/servicios/molecules/MaquinasSelector";
import { ProveedorToggle } from "@/components/admin/servicios/molecules/ProveedorToggle";
import { SucursalSelector } from "@/components/admin/servicios/molecules/SucursalSelector";
import { VariablesSection } from "@/components/admin/servicios/molecules/VariablesSection";
import { useNuevoServicioForm } from "@/lib/hooks/useNuevoServicioForm";

export function ViewNuevoServicio() {
  const { form, submitting, submitError, initialLoading, fetchError, canSubmit, options, actions } =
    useNuevoServicioForm();

  if (initialLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Cargando datos del formulario...</div>
      </div>
    );
  }

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
      <h1 className="text-3xl font-semibold text-[#1e1e1e] mb-6">Registrar nuevo servicio</h1>

      <form
        onSubmit={actions.handleSubmit}
        className="bg-white rounded-2xl shadow-[0px_4px_7px_0px_rgba(0,0,0,0.10)] p-8 space-y-6"
      >
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

        <Textarea
          label="Descripción:"
          value={form.descripcion_servicio}
          onChange={(e) => actions.updateField("descripcion_servicio", e.target.value)}
          placeholder="Describe brevemente el servicio (opcional)"
          maxLength={500}
        />

        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <MaquinasSelector
            opciones={options.maquinas}
            selectedIds={form.id_maquinas}
            onChange={(ids) => actions.updateField("id_maquinas", ids)}
            hasSucursal={form.id_sucursal !== null}
            loading={options.maquinasLoading}
          />

          <div className="flex flex-col gap-6">
            <InstaladorToggle
              opciones={options.instaladores}
              value={{
                id: form.id_instalador,
                costoOverride: form.costo_instalador_override,
              }}
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
              value={{
                id: form.id_proveedor,
                costoOverride: form.costo_proveedor_override,
              }}
              onChange={(v) =>
                actions.setForm((prev) => ({
                  ...prev,
                  id_proveedor: v.id,
                  costo_proveedor_override: v.costoOverride,
                }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
          <FormulaSection
            enabled={form.formulaEnabled}
            onToggle={(enabled) => actions.updateField("formulaEnabled", enabled)}
            chunks={form.formulaChunks}
            onChunksChange={(chunks) => actions.updateField("formulaChunks", chunks)}
            variables={form.variables}
            constantes={form.constantes}
            idInstalador={form.id_instalador}
            idProveedor={form.id_proveedor}
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

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="submit" variant="primary" disabled={submitting || !canSubmit}>
            {submitting ? "Guardando..." : "Guardar servicio"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={actions.onCancel}
            disabled={submitting}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
