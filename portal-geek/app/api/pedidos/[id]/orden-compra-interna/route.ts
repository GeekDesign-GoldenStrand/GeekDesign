/**
 * POST /api/pedidos/[id]/orden-compra-interna
 *
 * Generates one or more internal Purchase Order PDFs for a Pedido, one per
 * distinct priced third party (proveedor or instalador).
 *
 * Response variants:
 *   • Single third party  → HTTP 200, Content-Type: application/pdf (buffer direct)
 *   • Multiple parties    → HTTP 200, application/json
 *                           { ordenes_generadas: OrdenGenerada[] }
 *
 * Auth: Direccion or Colaborador (ADMIN_ROLES expansion applies via resolveSession).
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withRoleParams } from "@/lib/auth/guards";
import { PedidoIdParams } from "@/lib/schemas/pedidos";
import {
  getOrderThirdParties,
  type InstaladorEntry,
  type ProveedorEntry,
} from "@/lib/services/pedidos";
import { apiError } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";
import {
  calcularTotalesOrden,
  generatePurchaseOrderPDF,
  type POItemInput,
} from "@/lib/utils/pdf-purchase-order";

type Params = { id: string };

// ─── Line-item builders ───────────────────────────────────────────────────────
// Each builder maps an entry's detalles to POItemInput[], resolving the unit
// price from the associated ProveedorPrecios / InstaladorServicios row.

/**
 * Resolves line items for a single proveedor entry.
 * Service-level price (path B) takes priority over material-level price (path C)
 * when both apply to the same detalle.
 */
function buildProveedorItems(entry: ProveedorEntry): POItemInput[] {
  return entry.detalles.map((detalle) => {
    const precio =
      entry.precios.find((p) => p.id_servicio === detalle.id_servicio) ??
      entry.precios.find((p) => p.id_material === detalle.id_material);

    return {
      codigo: `DET-${detalle.id_detalle}`,
      descripcion: `${detalle.servicio.nombre_servicio} — ${detalle.material.nombre_material}`,
      cantidad: detalle.cantidad,
      precio_unitario: Number(precio?.precio ?? 0),
    };
  });
}

/**
 * Resolves line items for a single instalador entry.
 * Matches each detalle to its InstaladorServicios row by id_servicio.
 */
function buildInstaladorItems(entry: InstaladorEntry): POItemInput[] {
  return entry.detalles.map((detalle) => {
    const costo = entry.costos.find((c) => c.id_servicio === detalle.id_servicio);

    return {
      codigo: `DET-${detalle.id_detalle}`,
      descripcion: `${detalle.servicio.nombre_servicio} (Instalación) — ${detalle.material.nombre_material}`,
      cantidad: detalle.cantidad,
      precio_unitario: Number(costo?.costo ?? 0),
    };
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export const POST = withRoleParams<Params>(
  ["Direccion", "Colaborador"],
  async (_req: NextRequest, ctx, _session) => {
    try {
      // 1. Parse and validate the pedido ID.
      const { id } = PedidoIdParams.parse(await ctx.params);

      // 2. Fetch the pedido and group detalles by priced third party.
      const { proveedorMap, instaladorMap, pedido, sucursal } = await getOrderThirdParties(id);

      // 3. Guard: at least one priced link must exist.
      if (proveedorMap.size === 0 && instaladorMap.size === 0) {
        return apiError(
          "No se encontraron terceros vinculados a los servicios de este pedido",
          400
        );
      }

      // Buyer block — always the Geek Design sucursal tied to the pedido.
      // Telefono / correo are hardcoded because Sucursales has no contact columns.
      const clienteData = {
        nombre: sucursal?.nombre_sucursal ?? "Geek Design",
        empresa: "Geek Design",
        direccion:
          sucursal?.direccion ??
          "Av. Mediterráneo 236 B Fracc. Pirámides, Villa Corregidora, Querétaro",
        telefono: "442 254 6700",
        correo: "laser@geekdesign.mx",
      };

      const fecha = new Date();
      const totalTerceros = proveedorMap.size + instaladorMap.size;

      // ── Single third party: stream PDF directly ─────────────────────────────
      if (totalTerceros === 1) {
        let items: POItemInput[];
        let numero_orden: string;
        let vendedor: Parameters<typeof generatePurchaseOrderPDF>[0]["vendedor"];

        if (proveedorMap.size === 1) {
          const [proveedorId, entry] = [...proveedorMap.entries()][0];
          items = buildProveedorItems(entry);
          numero_orden = `OC-${pedido.id_pedido}-P${proveedorId}`;
          vendedor = {
            nombre: entry.proveedor.nombre_proveedor,
            empresa: entry.proveedor.apodo ?? null,
            direccion: entry.proveedor.ubicacion ?? null,
            telefono: entry.proveedor.telefono,
            correo: entry.proveedor.correo,
          };
        } else {
          const [instaladorId, entry] = [...instaladorMap.entries()][0];
          items = buildInstaladorItems(entry);
          numero_orden = `OC-${pedido.id_pedido}-I${instaladorId}`;
          vendedor = {
            nombre: entry.instalador.nombre_instalador,
            empresa: entry.instalador.apodo ?? null,
            direccion: entry.instalador.ubicacion ?? null,
            telefono: entry.instalador.telefono ?? null,
            correo: entry.instalador.correo ?? null,
          };
        }

        const buffer = await generatePurchaseOrderPDF({
          numero_orden,
          fecha,
          vendedor,
          cliente: clienteData,
          items,
        });

        // NextResponse body must be a Web API BodyInit type.
        // Node's Buffer extends Uint8Array; wrapping makes the type explicit.
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${numero_orden}.pdf"`,
          },
        });
      }

      // ── Multiple third parties: return JSON with base64-encoded PDFs ────────

      type OrdenGenerada = {
        tipo: "proveedor" | "instalador";
        nombre: string;
        pdf_base64: string;
        total: number;
      };

      const ordenes_generadas: OrdenGenerada[] = [];

      for (const [proveedorId, entry] of proveedorMap.entries()) {
        const items = buildProveedorItems(entry);
        const numero_orden = `OC-${pedido.id_pedido}-P${proveedorId}`;
        const { total } = calcularTotalesOrden(items);

        const buffer = await generatePurchaseOrderPDF({
          numero_orden,
          fecha,
          vendedor: {
            nombre: entry.proveedor.nombre_proveedor,
            empresa: entry.proveedor.apodo ?? null,
            direccion: entry.proveedor.ubicacion ?? null,
            telefono: entry.proveedor.telefono,
            correo: entry.proveedor.correo,
          },
          cliente: clienteData,
          items,
        });

        ordenes_generadas.push({
          tipo: "proveedor",
          nombre: entry.proveedor.nombre_proveedor,
          pdf_base64: buffer.toString("base64"),
          total,
        });
      }

      for (const [instaladorId, entry] of instaladorMap.entries()) {
        const items = buildInstaladorItems(entry);
        const numero_orden = `OC-${pedido.id_pedido}-I${instaladorId}`;
        const { total } = calcularTotalesOrden(items);

        const buffer = await generatePurchaseOrderPDF({
          numero_orden,
          fecha,
          vendedor: {
            nombre: entry.instalador.nombre_instalador,
            empresa: entry.instalador.apodo ?? null,
            direccion: entry.instalador.ubicacion ?? null,
            telefono: entry.instalador.telefono ?? null,
            correo: entry.instalador.correo ?? null,
          },
          cliente: clienteData,
          items,
        });

        ordenes_generadas.push({
          tipo: "instalador",
          nombre: entry.instalador.nombre_instalador,
          pdf_base64: buffer.toString("base64"),
          total,
        });
      }

      return NextResponse.json({ ordenes_generadas }, { status: 200 });
    } catch (err) {
      return handleError(err);
    }
  }
);
