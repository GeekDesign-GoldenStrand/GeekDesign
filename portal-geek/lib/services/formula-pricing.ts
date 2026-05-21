import { prisma } from "@/lib/db/client";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { evaluateFormula } from "@/lib/utils/formula-evaluator";

export interface CalcularPrecioInput {
  id_servicio: number;
  id_material: number;
  variables: Array<{ nombre_variable: string; valor: number }>;
}

// Loads the servicio's active formula + the selected material's price + the
// implicit costs, evaluates the formula, and returns the rounded precio_unitario.
// Currency rounded to two decimals.
export async function calcularPrecioServicio(input: CalcularPrecioInput): Promise<number> {
  const { id_servicio, id_material, variables: clienteValues } = input;

  const servicio = await prisma.servicios.findUnique({
    where: { id_servicio },
    include: {
      instalador: true,
      proveedor: true,
      formulas: {
        where: { estatus: "Activa" },
        include: {
          variables: true,
          constantes: {
            include: { instalador: true, proveedor: true },
          },
        },
      },
      servicioMateriales: {
        where: { id_material },
        include: { proveedorPrecio: true },
      },
    },
  });

  if (!servicio) {
    throw new NotFoundError(`Servicio ${id_servicio} no encontrado`);
  }

  const formula = servicio.formulas[0];
  if (!formula) {
    throw new ValidationError(`Servicio ${id_servicio} no tiene una fórmula activa para cotizar`);
  }

  const material = servicio.servicioMateriales[0];
  if (!material) {
    throw new ValidationError(`El material ${id_material} no está vinculado a este servicio`);
  }

  // Customer-provided overrides indexed by name.
  const overrides = new Map(clienteValues.map((v) => [v.nombre_variable, v.valor]));

  const variables = formula.variables.map((v) => {
    const override = overrides.get(v.nombre_variable);
    if (override !== undefined) {
      if (!v.editable_por_cliente) {
        throw new ValidationError(
          `La variable "${v.nombre_variable}" no es editable por el cliente`
        );
      }
      return { nombre_variable: v.nombre_variable, valor: override };
    }
    if (v.valor_default === null) {
      throw new ValidationError(`La variable "${v.nombre_variable}" requiere un valor`);
    }
    return { nombre_variable: v.nombre_variable, valor: Number(v.valor_default) };
  });

  const constantes = formula.constantes.map((c) => ({
    nombre_constante: c.nombre_constante,
    origen: c.origen,
    valor: c.valor === null ? null : Number(c.valor),
    instalador: c.instalador ? { costo_instalacion: Number(c.instalador.costo_instalacion) } : null,
    proveedor: c.proveedor
      ? {
          costo: c.proveedor.costo === null ? null : Number(c.proveedor.costo),
        }
      : null,
  }));

  const precio_material = material.proveedorPrecio ? Number(material.proveedorPrecio.precio) : 0;

  const costo_instalador =
    servicio.costo_instalador_override !== null
      ? Number(servicio.costo_instalador_override)
      : servicio.instalador
        ? Number(servicio.instalador.costo_instalacion)
        : 0;

  const costo_proveedor =
    servicio.costo_proveedor_override !== null
      ? Number(servicio.costo_proveedor_override)
      : servicio.proveedor && servicio.proveedor.costo !== null
        ? Number(servicio.proveedor.costo)
        : 0;

  const precioUnitario = evaluateFormula({
    expresion: formula.expresion,
    variables,
    constantes,
    implicits: { precio_material, costo_instalador, costo_proveedor },
  });

  return Math.round(precioUnitario * 100) / 100;
}
