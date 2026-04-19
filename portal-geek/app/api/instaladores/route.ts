import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateInstaladorSchema } from "@/lib/schemas/instaladores";
import { listInstaladores, createInstalador } from "@/lib/services/instaladores";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

const ALL_ADMIN = ["Direccion", "Administrador", "Colaborador", "Finanzas"] as const;

export const GET = withRole([...ALL_ADMIN], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const result = await listInstaladores(page, pageSize);
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Direccion", "Administrador"], async (req: NextRequest) => {
  try {
    const body = CreateInstaladorSchema.parse(await req.json());
    return created(await createInstalador(body));
  } catch (err) {
    return handleError(err);
  }
});
