import { withRole } from "@/lib/auth/guards";
import { listActivePedidoServices } from "@/lib/services/pedidos";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(["Direccion", "Colaborador"], async () => {
  try {
    const services = await listActivePedidoServices();

    return ok(services);
  } catch (err) {
    return handleError(err);
  }
});
