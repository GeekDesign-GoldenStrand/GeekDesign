"use client";

import { useState } from "react";

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface Usuario {
  id_usuario: number;
  nombre_completo: string;
  correo_electronico: string;
  estatus: string;
  id_rol: number;
  rol: Rol;
}

interface Props {
  usuarios: Usuario[];
  roles: Rol[];
}

export function UsuariosTable({ usuarios: initialUsuarios, roles }: Props) {
  const [usuarios, setUsuarios] = useState(initialUsuarios);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  async function handleRolChange(userId: number, newRolId: number) {
    setSaving(userId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_rol: newRolId }),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: Usuario;
        error?: string;
      } | null;
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
      setSuccess(userId);
      setTimeout(() => setSuccess(null), 2500);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-[14px] text-[#df2646]">
          {error}
        </p>
      )}
      <table className="w-full border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-b border-[#e5e5e5] text-[12px] uppercase tracking-[0.8px] text-[#888]">
            <th className="py-3 pr-6">Nombre</th>
            <th className="py-3 pr-6">Correo</th>
            <th className="py-3 pr-6">Estatus</th>
            <th className="py-3">Rol</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id_usuario} className="border-b border-[#f0f0f0] hover:bg-[#fff8f9]">
              <td className="py-3 pr-6 font-medium text-[#333]">{u.nombre_completo}</td>
              <td className="py-3 pr-6 text-[#555]">{u.correo_electronico}</td>
              <td className="py-3 pr-6">
                <span
                  className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                    u.estatus === "Activo"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-[#df2646]"
                  }`}
                >
                  {u.estatus}
                </span>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <select
                    value={u.id_rol}
                    disabled={saving === u.id_usuario}
                    onChange={(e) => handleRolChange(u.id_usuario, Number(e.target.value))}
                    className="rounded-full border border-[#a79999] bg-white px-4 py-2 text-[14px] text-[#333] shadow-sm outline-none focus:border-[#df2646] disabled:opacity-60"
                  >
                    {roles.map((r) => (
                      <option key={r.id_rol} value={r.id_rol}>
                        {r.nombre_rol}
                      </option>
                    ))}
                  </select>
                  {saving === u.id_usuario && (
                    <span className="text-[12px] text-[#888]">Guardando…</span>
                  )}
                  {success === u.id_usuario && (
                    <span className="text-[12px] text-green-600">Guardado</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {usuarios.length === 0 && (
        <p className="py-10 text-center text-[14px] text-[#888]">No hay usuarios registrados.</p>
      )}
    </div>
  );
}
