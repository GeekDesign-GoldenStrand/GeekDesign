import { formatDate } from "@/lib/utils/date";

// Bottom-of-card timestamp line. The label mirrors UserCard's "Modificado:
// <date>" wording so the Maquinas grid lines up visually with the
// Colaboradores grid (and the date renders in the shared DD MMM YYYY shape).
export default function MaquinaCreationDate({ creationDate }: { creationDate: string }) {
  return <p className="text-[14px] text-gray-500">Creado: {formatDate(creationDate)}</p>;
}
