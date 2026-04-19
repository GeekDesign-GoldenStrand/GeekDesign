import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateProveedorSchema } from "@/lib/schemas/proveedores";
import { listProveedores, createProveedor } from "@/lib/services/proveedores";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

const ALL_ADMIN = ["Direccion", "Administrador", "Colaborador", "Finanzas"] as const;

export const GET = withRole([...ALL_ADMIN], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const result = await listProveedores(page, pageSize);
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Direccion", "Administrador"], async (req: NextRequest) => {
  try {
    const body = CreateProveedorSchema.parse(await req.json());
    return created(await createProveedor(body));
  } catch (err) {
    return handleError(err);
  }
});
