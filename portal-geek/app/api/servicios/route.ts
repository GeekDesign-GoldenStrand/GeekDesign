import type { NextRequest, } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateServicioSchema } from "@/lib/schemas/servicios";
import { listServicios, createServicio } from "@/lib/services/servicios";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(["Administrador"], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const result = await listServicios(page, pageSize);
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Administrador"], async (req: NextRequest) => {
  try {
    const body = CreateServicioSchema.parse(await req.json());
    return created(await createServicio(body));
  } catch (err) {
    return handleError(err);
  }
});
