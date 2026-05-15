import { formatDate } from "@/lib/utils/format";

export default function MaquinaCreationDate({ creationDate }: { creationDate: string }) {
  return <p className="text-[12px] text-gray-500">Creada el {formatDate(creationDate)}</p>;
}
