/**
 * @jest-environment node
 */
import { mapServicioDetalladoToFormState } from "@/lib/utils/servicio-mappers";
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
