import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateMaterialSchema } from "@/lib/schemas/materiales";
import { listMateriales, createMaterial } from "@/lib/services/materiales";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(["Direccion", "Colaborador"], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const result = await listMateriales(page, pageSize);
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Direccion"], async (req: NextRequest) => {
  try {
    const body = CreateMaterialSchema.parse(await req.json());
    return created(await createMaterial(body));
  } catch (err) {
    return handleError(err);
  }
});
