import { prisma } from "@/lib/db/client";
import { ConfigurationError } from "@/lib/utils/errors";

// Marker columns used by the seed to make the placeholder rows queryable
// without hard-coding numeric IDs that change across resets.
const SISTEMA_EMAIL = "sistema@geekdesign.mx";
const PLACEHOLDER_ARCHIVO_NAME = "__PLACEHOLDER__";

let cachedSistemaId: number | null = null;
let cachedArchivoId: number | null = null;

// SISTEMA user id — used as id_usuario_asigno on VariablesCotizacion
// when an anonymous customer submits a quote. Login is disabled at the
// seed level (random password, estatus=Inactivo).
export async function getSistemaUserId(): Promise<number> {
  if (cachedSistemaId !== null) return cachedSistemaId;
  const user = await prisma.usuarios.findUnique({
    where: { correo_electronico: SISTEMA_EMAIL },
  });
  if (!user) {
    throw new ConfigurationError(
      `Usuario SISTEMA (${SISTEMA_EMAIL}) no existe — ejecuta npm run db:seed`
    );
  }
  cachedSistemaId = user.id_usuario;
  return cachedSistemaId;
}

// Placeholder ArchivosDisenio.id_archivo — used on draft DetallePedido until
// ST-06 (file upload) lets the customer attach a real design.
export async function getPlaceholderArchivoId(): Promise<number> {
  if (cachedArchivoId !== null) return cachedArchivoId;
  const archivo = await prisma.archivosDisenio.findFirst({
    where: { nombre_archivo: PLACEHOLDER_ARCHIVO_NAME },
  });
  if (!archivo) {
    throw new ConfigurationError(
      `ArchivosDisenio placeholder (nombre="${PLACEHOLDER_ARCHIVO_NAME}") no existe — ejecuta npm run db:seed`
    );
  }
  cachedArchivoId = archivo.id_archivo;
  return cachedArchivoId;
}
