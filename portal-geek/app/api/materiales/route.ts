import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withRole } from "@/lib/auth/guards";
import {
  CreateGrupoMaterialSchema,
  CreateMaterialSchema,
  CreateSubMaterialSchema,
} from "@/lib/schemas/materiales";
import {
  createGrupo,
  createMaterial,
  createSubMaterial,
  getMaterialesGrupos,
  getMaterialesOptions,
  listMateriales,
} from "@/lib/services/materiales";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(
  ["Direccion", "Administrador", "Colaborador"],
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const mode = searchParams.get("mode");

      if (mode === "options") {
        const data = await getMaterialesOptions();
        return NextResponse.json({ data });
      }

      if (mode === "grupos") {
        const data = await getMaterialesGrupos();
        return NextResponse.json({ data });
      }

      const page = Math.max(1, Number(searchParams.get("page") ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
      const q = searchParams.get("q")?.trim() || undefined;
      const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";
      const result = await listMateriales(page, pageSize, q, sort);
      return paginated(result.items, result.total, page, pageSize);
    } catch (err) {
      return handleError(err);
    }
  }
);

export const POST = withRole(["Direccion"], async (req: NextRequest) => {
  try {
    const body = await req.json();
    const tipo = body?.tipo;

    if (tipo === "grupo") {
      const parsed = CreateGrupoMaterialSchema.parse(body);
      return created(await createGrupo(parsed));
    }

    if (tipo === "sub") {
      const parsed = CreateSubMaterialSchema.parse(body);
      return created(await createSubMaterial(parsed));
    }

    // Default: individual material (backward-compatible, tipo absent or "individual")
    const parsed = CreateMaterialSchema.parse(body);
    return created(await createMaterial(parsed));
  } catch (err) {
    return handleError(err);
  }
});
