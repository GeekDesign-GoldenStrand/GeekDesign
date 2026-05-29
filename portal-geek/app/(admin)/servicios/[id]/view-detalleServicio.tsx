"use client";

import { LockKeyIcon } from "@phosphor-icons/react";
import Link from "next/link";

import { Icon } from "@/components/admin/servicios/atoms/Icon";
import { Button } from "@/components/ui/atoms/Button";
import type { ServicioAdminDetalle } from "@/types/servicios";

type Props = { servicio: ServicioAdminDetalle };

// ── Read-only formula token renderer ─────────────────────────────────────

function FormulaReadOnly({ expresion }: { expresion: string }) {
  if (!expresion.trim()) return <span className="text-gray-400 italic text-sm">Sin fórmula</span>;
  return (
    <p className="font-mono text-sm text-[#1e1e1e] bg-gray-50 rounded-md border border-gray-200 px-3 py-2 break-all">
      {expresion}
    </p>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-4 border-t border-gray-200">
      <h3 className="text-base font-bold text-[#1e1e1e] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 italic">{text}</p>;
}

// ── Component ─────────────────────────────────────────────────────────────

export function ViewDetalleServicio({ servicio }: Props) {
  const costoInstaladorEfectivo =
    servicio.costo_instalador_override !== null
      ? Number(servicio.costo_instalador_override)
      : servicio.instalador
        ? Number(servicio.instalador.costo_instalacion)
        : null;

  const costoProveedorEfectivo =
    servicio.costo_proveedor_override !== null
      ? Number(servicio.costo_proveedor_override)
      : servicio.proveedor?.costo !== null && servicio.proveedor?.costo !== undefined
        ? Number(servicio.proveedor.costo)
        : null;

  const formatCosto = (n: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl shadow-[0px_4px_7px_0px_rgba(0,0,0,0.10)] p-8 space-y-6">
        {/* Descripción + Sucursal */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-bold text-[#1e1e1e] mb-1">Descripción:</p>
            <p className="text-sm text-gray-600">
              {servicio.descripcion_servicio ?? (
                <span className="italic text-gray-400">Sin descripción</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e1e1e] mb-1">Sucursal:</p>
            <p className="text-sm text-gray-600">{servicio.sucursal.nombre_sucursal}</p>
          </div>
        </div>

        {/* Instalador | Proveedor | Máquinas */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm font-bold text-[#1e1e1e] mb-1">Instalador:</p>
            {servicio.instalador ? (
              <div className="text-sm text-gray-600 space-y-0.5">
                <p>{servicio.instalador.nombre_instalador}</p>
                {costoInstaladorEfectivo !== null && (
                  <p>
                    {formatCosto(costoInstaladorEfectivo)}
                    {servicio.costo_instalador_override !== null && (
                      <span className="ml-1 text-xs text-[#e42200]">(modificado)</span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <EmptyState text="Sin instalador asignado" />
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-[#1e1e1e] mb-1">Proveedor:</p>
            {servicio.proveedor ? (
              <div className="text-sm text-gray-600 space-y-0.5">
                <p>{servicio.proveedor.nombre_proveedor}</p>
                {costoProveedorEfectivo !== null && (
                  <p>
                    {formatCosto(costoProveedorEfectivo)}
                    {servicio.costo_proveedor_override !== null && (
                      <span className="ml-1 text-xs text-[#e42200]">(modificado)</span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <EmptyState text="Sin proveedor asignado" />
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-[#1e1e1e] mb-1">Máquina(s):</p>
            {servicio.maquinas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {servicio.maquinas.map((m) => (
                  <span
                    key={m.maquina.id_maquina}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#fce4e4] text-[#e42200] border border-[#fcc]"
                  >
                    {m.maquina.apodo_maquina}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyState text="Sin máquinas asignadas" />
            )}
          </div>
        </div>

        {/* Materiales */}
        <Section title="Materiales:">
          {servicio.materiales.length === 0 ? (
            <EmptyState text="Sin materiales asignados" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-[#1e1e1e] border-collapse">
                <thead>
                  <tr className="bg-[#c6c6c6] text-[14px] font-bold">
                    {["Nombre", "Descripción", "Unidad", "Ancho", "Alto", "Grosor", "Color"].map(
                      (h) => (
                        <th key={h} className="px-3 py-2 text-center">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {servicio.materiales.map((m) => (
                    <tr
                      key={m.id_servicio_material}
                      className="bg-white shadow-sm border-b border-gray-100"
                    >
                      <td className="px-3 py-2 text-center font-semibold">
                        {m.material.nombre_material}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-500">
                        {m.material.descripcion_material ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-center">{m.material.unidad_medida}</td>
                      <td className="px-3 py-2 text-center">{m.material.ancho ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{m.material.alto ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{m.material.grosor ?? "-"}</td>
                      <td className="px-3 py-2 text-center">{m.material.color ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Fórmula */}
        <Section title="Fórmula:">
          {servicio.formulaActiva ? (
            <FormulaReadOnly expresion={servicio.formulaActiva.expresion} />
          ) : (
            <EmptyState text="Sin fórmula definida" />
          )}
        </Section>

        {/* Variables */}
        {servicio.formulaActiva && servicio.formulaActiva.variables.length > 0 && (
          <Section title="Variables:">
            <div className="flex flex-wrap gap-2">
              {servicio.formulaActiva.variables.map((v) => (
                <div
                  key={v.id_variable}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-[#fce4e4] text-[#e42200] border border-[#fce4e4]"
                  title={v.etiqueta}
                >
                  <span className="font-mono">{v.nombre_variable}</span>
                  <span className="text-xs opacity-70">
                    {v.valor_default ?? "—"}
                    {v.unidad ? ` ${v.unidad}` : ""}
                    {" · "}
                    {v.editable_por_cliente ? "editable" : "fija"}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Constantes */}
        {servicio.formulaActiva && servicio.formulaActiva.constantes.length > 0 && (
          <Section title="Constantes:">
            <div className="flex flex-wrap gap-2">
              {servicio.formulaActiva.constantes.map((c) => {
                const isGlobal = c.origen === "global";
                return (
                  <div
                    key={c.id_constante}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      isGlobal
                        ? "bg-blue-100 text-blue-900 border border-blue-300"
                        : "bg-[#fce4e4] text-[#e42200] border border-[#fce4e4]"
                    }`}
                  >
                    {isGlobal && <Icon LibIcon={LockKeyIcon} size={12} weight="bold" />}
                    <span className="font-mono">{c.nombre_constante}</span>
                    {c.valor !== null && <span className="text-xs opacity-70">{c.valor}</span>}
                    <span className="text-xs opacity-60">— {c.origen}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Footer buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 justify-end">
          <Button asChild variant="primary">
            <Link href={`/servicios/${servicio.id_servicio}/editar`}>Modificar servicio</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/servicios">Cancelar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
