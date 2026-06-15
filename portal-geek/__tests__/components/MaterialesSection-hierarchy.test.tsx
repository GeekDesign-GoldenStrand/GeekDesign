/**
 * @jest-environment jsdom
 *
 * Locks in how the service form's material picker handles the 3-level
 * hierarchy (categoría → grupo → variante + individuales).
 *
 * The picker must distinguish a *variante* (parent is a grupo → only reachable
 * through the group picker) from an *individual* (no parent, OR a categoría
 * parent → added directly). The old code keyed on `id_material_padre === null`,
 * which broke after the migration reparented every individual under
 * "Sin categoría": category-bound individuals vanished from the leaf list and
 * showed up under a phantom "Grupo #<id>" header when selected.
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { MaterialesSection } from "@/components/admin/servicios/molecules/MaterialesSection";
import type { MaterialOption } from "@/types/servicios";

function leaf(
  partial: Partial<MaterialOption> & { id_material: number; nombre_material: string }
): MaterialOption {
  return {
    id_material_padre: null,
    es_grupo: false,
    descripcion_material: null,
    unidad_medida: null,
    ancho: null,
    alto: null,
    grosor: null,
    color: null,
    velocidad_avance: null,
    ...partial,
  };
}

// getMaterialesOptions returns every leaf (individuals + variants), flat.
const OPCIONES: MaterialOption[] = [
  leaf({ id_material: 10, nombre_material: "Vinil adhesivo" }), // root individual
  leaf({ id_material: 11, nombre_material: "Acrílico de Maderas", id_material_padre: 5 }), // individual under categoría 5
  leaf({ id_material: 12, nombre_material: "MDF 3mm", id_material_padre: 2 }), // variante under grupo 2
];

// mode=grupos returns groups with their variants. Group 2 owns the variant 12.
const GRUPOS_PAYLOAD = {
  data: [
    {
      id_material: 2,
      nombre_material: "MDF",
      subMateriales: [{ id_material: 12, nombre_material: "MDF 3mm", id_material_padre: 2 }],
    },
  ],
};

beforeEach(() => {
  global.fetch = jest.fn((url: RequestInfo | URL) => {
    const href = String(url);
    if (href.includes("mode=grupos")) {
      return Promise.resolve({ json: () => Promise.resolve(GRUPOS_PAYLOAD) } as Response);
    }
    // proveedor-precios and anything else
    return Promise.resolve({ json: () => Promise.resolve({ data: [] }) } as Response);
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

const noop = () => {};

it("el picker lista individuales (raíz y bajo categoría) y excluye variantes de grupo", async () => {
  render(
    <MaterialesSection
      enabled
      onToggle={noop}
      materiales={[]}
      opcionesMateriales={OPCIONES}
      onAdd={noop}
      onRemove={noop}
      onUpdateProveedor={noop}
    />
  );

  // Open the catalog dropdown.
  fireEvent.click(screen.getByRole("button", { name: "+ Agregar" }));

  // Wait for the mode=grupos fetch to resolve (group "MDF" shows up).
  expect(await screen.findByText("MDF")).toBeInTheDocument();

  // Both individuals are directly addable — including the one under a categoría.
  expect(screen.getByText("Vinil adhesivo")).toBeInTheDocument();
  expect(screen.getByText("Acrílico de Maderas")).toBeInTheDocument();

  // The variant is NOT in the leaf list — it's reachable only via the group.
  expect(screen.queryByText("MDF 3mm")).not.toBeInTheDocument();
});

it("un individual bajo categoría seleccionado se muestra como fila suelta, no bajo un grupo fantasma", async () => {
  render(
    <MaterialesSection
      enabled
      onToggle={noop}
      materiales={[{ id_material: 11, id_proveedor_precio: null }]}
      opcionesMateriales={OPCIONES}
      onAdd={noop}
      onRemove={noop}
      onUpdateProveedor={noop}
    />
  );

  // The selected individual renders by name…
  expect(await screen.findByText("Acrílico de Maderas")).toBeInTheDocument();
  // …and never under a fabricated "Grupo #5" header (its parent is a categoría).
  expect(screen.queryByText(/Grupo #/)).not.toBeInTheDocument();
});
