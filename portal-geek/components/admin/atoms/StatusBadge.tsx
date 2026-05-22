import { STATUS_STYLES } from "@/lib/constants/statusColors";

interface Props {
  status: "Activo" | "Inactivo";
  onChange?: (value: "Activo" | "Inactivo") => void;
}

// Branch status selector styled like a badge.
// The color map is centralized so active/inactive styles stay consistent across views.
export function StatusBadge({ status, onChange }: Props) {
  const style = STATUS_STYLES.sucursal[status];

  return (
    <select
      value={status}
      onChange={(e) => onChange?.(e.target.value as "Activo" | "Inactivo")}
      className="
        px-4
        pr-10
        py-2
        rounded-xl
        border-2
        font-medium
        outline-none
        cursor-pointer
      "
      style={{
        background: style.background,
        borderColor: style.border,
        color: style.text,
      }}
    >
      <option value="Activo">Activo</option>

      <option value="Inactivo">Inactivo</option>
    </select>
  );
}
