/**
 * @jest-environment node
 */
import type { ConstanteDraft } from "@/components/admin/servicios/molecules/ConstantesSection";
import {
  mapServicioDetalladoToFormState,
  stripUiOnlyConstants,
} from "@/lib/utils/servicio-mappers";
import type { ServicioAdminDetalle } from "@/types/servicios";

function makeDetalle(overrides: Partial<ServicioAdminDetalle> = {}): ServicioAdminDetalle {
  return {
    id_servicio: 1,
    nombre_servicio: "Test",
    descripcion_servicio: null,
    imagenes: [],
    id_sucursal: 1,
    sucursal: { id_sucursal: 1, nombre_sucursal: "Principal" },
    id_instalador: null,
    costo_instalador_override: null,
    instalador: null,
    id_proveedor: null,
    costo_proveedor_override: null,
    proveedor: null,
    maquinas: [],
    materiales: [],
    formulaActiva: null,
    ...overrides,
  };
}

// Regression coverage for the ADMIN-02 merge bug. Before this fix the mapper
// hardcoded `imagenes: []`, so editing a servicio with saved images dropped
// them on the first save.
describe("mapServicioDetalladoToFormState imagenes", () => {
  it("propaga imagenes del detalle al estado del form", () => {
    const detalle = makeDetalle({ imagenes: ["servicios/a.png", "servicios/b.png"] });
    const state = mapServicioDetalladoToFormState(detalle);
    expect(state.imagenes).toEqual(["servicios/a.png", "servicios/b.png"]);
  });

  it("deja imagenes como [] cuando el detalle no tiene imágenes", () => {
    const state = mapServicioDetalladoToFormState(makeDetalle({ imagenes: [] }));
    expect(state.imagenes).toEqual([]);
  });
});

// Regression coverage for the formula-save bug: the form keeps a synthetic
// "global" constant for the implicit IVA chip, which the API schema rejects
// as a reserved identifier. The submit pipeline must strip these UI-only
// placeholders while preserving every real (manual) constant the user added.
describe("stripUiOnlyConstants", () => {
  it("removes synthetic global constants (IVA chip) but keeps manual ones", () => {
    const input: ConstanteDraft[] = [
      { nombre_constante: "iva", origen: "global", valor: 0.16 },
      { nombre_constante: "markup", origen: "manual", valor: 1.4 },
      { nombre_constante: "comision", origen: "manual", valor: 0.1 },
    ];
    expect(stripUiOnlyConstants(input)).toEqual([
      { nombre_constante: "markup", origen: "manual", valor: 1.4 },
      { nombre_constante: "comision", origen: "manual", valor: 0.1 },
    ]);
  });

  it("returns an empty array when there are no constants", () => {
    expect(stripUiOnlyConstants([])).toEqual([]);
  });
});
