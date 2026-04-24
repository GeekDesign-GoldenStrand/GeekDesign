import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateTipoVariableSchema } from "@/lib/schemas/tipos-variable";
import {
  listTiposVariable,
  createTipoVariable,
} from "@/lib/services/tipos-variable";
import { ok, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(["Administrador"], async () => {
  try {
    return ok(await listTiposVariable());
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Administrador"], async (req: NextRequest) => {
  try {
    const body = CreateTipoVariableSchema.parse(await req.json());
    return created(await createTipoVariable(body));
  } catch (err) {
    return handleError(err);
  }
});