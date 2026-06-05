interface Props {
  status: string;
}

export function StatusTag({ status }: Props) {
  const isActive = status === "Activo";
  return (
    <span
      className={`px-3 py-1 rounded text-sm font-semibold ${
        isActive ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
      }`}
    >
      {status}
    </span>
  );
}
