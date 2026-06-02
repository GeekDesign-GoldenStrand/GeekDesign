"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { Button } from "@/components/ui/atoms/Button";

import { InputField } from "../atoms/InputField";
import { StatusBadge } from "../atoms/StatusBadge";
import { ConfirmDialog } from "../molecules/ConfirmDialog";

interface RelationItem {
  id: number;
  name: string;
}

export interface SucursalFormData {
  nombre_sucursal: string;
  direccion: string;
  horario_apertura: string;
  horario_salida: string;
  estatus: "Activo" | "Inactivo";

  pedidos: RelationItem[];
  colaboradores: RelationItem[];
  maquinas: RelationItem[];
}

interface Props {
  mode: "create" | "edit";

  initialData?: SucursalFormData;

  onSubmit: (data: SucursalFormData) => Promise<void>;

  onDelete?: () => Promise<void>;
}

export function SucursalForm({ mode, initialData, onSubmit, onDelete }: Props) {
  const router = useRouter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SucursalFormData>({
    nombre_sucursal: initialData?.nombre_sucursal ?? "",
    direccion: initialData?.direccion ?? "",
    horario_apertura: initialData?.horario_apertura ?? "",
    horario_salida: initialData?.horario_salida ?? "",
    estatus: initialData?.estatus ?? "Activo",

    pedidos: initialData?.pedidos ?? [],
    colaboradores: initialData?.colaboradores ?? [],
    maquinas: initialData?.maquinas ?? [],
  });

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(formData);
      router.push("/sucursales");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo guardar la sucursal");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    setSubmitError(null);
    try {
      await onDelete();
      router.push("/sucursales");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo eliminar la sucursal");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#ECECEC] text-[#1e1e1e]">
        {/* Header */}
        <AdminHeader
          title={
            mode === "create"
              ? "Registrar Sucursal"
              : `Editar Sucursal: ${formData.nombre_sucursal}`
          }
        />

        {/* Content */}
        <div className="flex-1 px-16 py-10">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
            {/* LEFT COLUMN */}
            <div className="space-y-8">
              <InputField
                label="Nombre:"
                value={formData.nombre_sucursal}
                placeholder="Sucursal 1"
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    nombre_sucursal: value,
                  })
                }
              />

              <InputField
                label="Dirección:"
                value={formData.direccion}
                placeholder="Dirección"
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    direccion: value,
                  })
                }
              />

              <InputField
                label="Horario de apertura:"
                type="time"
                value={formData.horario_apertura}
                placeholder="09:00 HRS"
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    horario_apertura: value,
                  })
                }
              />

              <InputField
                label="Horario de salida:"
                type="time"
                value={formData.horario_salida}
                placeholder="20:00 HRS"
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    horario_salida: value,
                  })
                }
              />

              <div className="flex flex-col gap-2">
                <label className="font-bold text-[#1E1E1E] text-[16px]">Estatus</label>

                <div className="w-fit">
                  <StatusBadge
                    status={formData.estatus}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        estatus: value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-8">
              <RelationSection title="Pedidos:" items={formData.pedidos} />

              <RelationSection title="Colaboradores:" items={formData.colaboradores} />

              <RelationSection title="Máquinas:" items={formData.maquinas} />
            </div>
          </div>

          {submitError && (
            <div role="alert" className="mt-12 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex justify-end items-center gap-6 mt-24">
            {mode === "edit" && (
              <button
                type="button"
                disabled={submitting || deleting}
                onClick={() => {
                  const skipModal = localStorage.getItem("hideDeleteConfirmation") === "true";

                  if (skipModal) {
                    handleDelete();
                  } else {
                    setShowDeleteModal(true);
                  }
                }}
                className="
                    text-[#1E1E1E]
                    underline
                    text-[16px]
                    font-medium
                    hover:text-[#E42200]
                    transition-colors
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                "
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            )}

            <Button
              variant="secondary"
              size="md"
              disabled={submitting || deleting}
              onClick={() => router.push("/sucursales")}
            >
              Cancelar
            </Button>

            <Button variant="primary" size="md" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteModal}
        title="Confirmar eliminación"
        description="¿Seguro que desea eliminar este elemento?"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

interface RelationSectionProps {
  title: string;
  items: RelationItem[];
}

function RelationSection({ title, items }: RelationSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-bold text-[#1E1E1E] text-[16px]">{title}</h2>

      <div
        className="
          bg-white
          rounded-md
          shadow-md
          px-4
          py-3
          min-h-[140px]
          text-[#8E8E8E]
        "
      >
        {items.length === 0 ? (
          <span className="text-[#8E8E8E] text-[16px]">Sin elementos asignados</span>
        ) : (
          <ol className="list-decimal ml-5 text-[#8E8E8E] text-[16px] space-y-1">
            {items.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
