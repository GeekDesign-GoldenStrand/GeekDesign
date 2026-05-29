import { withSection } from "@/lib/auth/guards";
import { getEmpresasPedidos } from "@/lib/services/pedidos";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withSection("pedidos", "read", async () => {
  try {
    const empresas = await getEmpresasPedidos();
    return ok(empresas);
  } catch (err) {
    return handleError(err);
  }
});
