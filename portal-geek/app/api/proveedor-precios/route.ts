import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(
  ["Direccion", "Administrador", "Colaborador"],
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const idMaterial = searchParams.get("id_material");

      if (!idMaterial || isNaN(Number(idMaterial))) {
        return NextResponse.json({ error: "id_material requerido" }, { status: 400 });
      }

      const data = await prisma.proveedorPrecios.findMany({
        where: { id_material: Number(idMaterial) },
        include: { proveedor: { select: { nombre_proveedor: true } } },
        orderBy: { precio: "asc" },
      });

      return NextResponse.json({ data });
    } catch (err) {
      return handleError(err);
    }
  }
);
