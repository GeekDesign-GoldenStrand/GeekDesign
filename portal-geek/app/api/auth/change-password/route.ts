import { withAuth } from "@/lib/auth/guards";
import { ChangePasswordSchema } from "@/lib/schemas/auth";
import { changePassword } from "@/lib/services/change-password";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const PUT = withAuth(async (req, session) => {
  try {
    const body = ChangePasswordSchema.parse(await req.json());
    await changePassword(session.id, body.currentPassword, body.newPassword);
    return ok({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    return handleError(err);
  }
});
