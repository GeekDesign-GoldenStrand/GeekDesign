import { withRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(["Direccion"], async () => {
  try {
    const roles = await prisma.roles.findMany({ orderBy: { id_rol: "asc" } });
    return ok(roles);
  } catch (err) {
    return handleError(err);
  }
});
