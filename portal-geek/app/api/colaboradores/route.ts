import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateColaboradorSchema } from "@/lib/schemas/colaboradores";
import { listColaboradores, createColaborador } from "@/lib/services/colaboradores";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(["Direccion", "Administrador"], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const result = await listColaboradores(page, pageSize);
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Direccion", "Administrador"], async (req: NextRequest) => {
  try {
    const body = CreateColaboradorSchema.parse(await req.json());
    const colaborador = await createColaborador(body);
    return created(colaborador);
  } catch (err) {
    return handleError(err);
  }
});
