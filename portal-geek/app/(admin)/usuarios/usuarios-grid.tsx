"use client";

import { useState } from "react";

import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { UserCard, type UserCardUser } from "@/components/admin/user-card";

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface UsuarioRow extends UserCardUser {
  correo_electronico: string;
}

interface Props {
  usuarios: UsuarioRow[];
  roles: Rol[];
}

export function UsuariosGrid({ usuarios: initialUsuarios, roles }: Props) {
  const [usuarios, setUsuarios] = useState(initialUsuarios);
  const [saving, setSaving] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleRolChange(userId: number, newRolId: number) {
    setSaving(userId);
    setError(null);
    try {
      const res = await fetch(`/api/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_rol: newRolId }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "Error al actualizar el rol");
        return;
      }
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === userId
            ? { ...u, id_rol: newRolId, rol: roles.find((r) => r.id_rol === newRolId) ?? u.rol }
            : u
        )
      );
    } finally {
      setSaving(null);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? usuarios.filter(
        (u) =>
          u.nombre_completo.toLowerCase().includes(q) ||
          u.correo_electronico.toLowerCase().includes(q)
      )
    : usuarios;

  return (
    <div>
      <div className="px-8 pt-6 pb-4">
        <AdminToolbar search={search} onSearchChange={setSearch} />
        {error && (
          <p role="alert" className="mt-3 text-[14px] text-[#df2646]">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-5 px-8 pb-10">
        {filtered.map((u) => (
          <UserCard
            key={u.id_usuario}
            user={u}
            roles={roles}
            onRolChange={handleRolChange}
            saving={saving === u.id_usuario}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-4 py-16 text-center font-ibm-plex text-[#888]">
            {q ? "Sin resultados para esa búsqueda." : "No hay usuarios registrados."}
          </p>
        )}
      </div>
    </div>
  );
}
