import { withRoleParams } from "@/lib/auth/guards";
import { ClienteIdParams, UpdateClienteSchema } from "@/lib/schemas/clientes";
import { getCliente, updateCliente, deleteCliente } from "@/lib/services/clientes";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

const ALL_ADMIN = ["Direccion", "Administrador", "Colaborador", "Finanzas"] as const;

export const GET = withRoleParams<Params>([...ALL_ADMIN], async (_req, ctx) => {
  try {
    const { id } = ClienteIdParams.parse(await ctx.params);
    const cliente = await getCliente(id);
    return ok(cliente);
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion", "Administrador"], async (req, ctx) => {
  try {
    const { id } = ClienteIdParams.parse(await ctx.params);
    const body = UpdateClienteSchema.parse(await req.json());
    const cliente = await updateCliente(id, body);
    return ok(cliente);
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion", "Administrador"], async (_req, ctx) => {
  try {
    const { id } = ClienteIdParams.parse(await ctx.params);
    await deleteCliente(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
