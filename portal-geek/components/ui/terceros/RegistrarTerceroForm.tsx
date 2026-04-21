"use client";

import { useState } from "react";

import type { CreateInstaladorInput } from "@/lib/schemas/instaladores";
import type { CreateProveedorInput } from "@/lib/schemas/proveedores";
import type { TerceroCardProps } from "@/types";

type TerceroType = "Proveedor" | "Instalador";

interface RegistrarTerceroFormProps {
    onCreated: (row: TerceroCardProps & { id: number }) => void;
    onClose: () => void;
    initialType?: TerceroType;
}

const FIELD =
    "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors";

const FIELD_ERROR = "border-[#e42200]";
const FIELD_SUCCESS = "border-[#00c853]";
const LABEL = "block text-[13px] font-medium text-[#575757] mb-1";
const ERROR_MSG = "text-[12px] text-[#e42200] mt-1";

export default function RegistrarTerceroForm({
    onCreated,
    onClose,
    initialType = "Proveedor",
}: RegistrarTerceroFormProps) {
    const [terceroType, setTerceroType] = useState<TerceroType>(initialType);

    const [form, setForm] = useState({
        nombre_proveedor: "",
        apodo: "",
        tipo_proveedor: "Proveedor de material" as CreateProveedorInput["tipo"],
        tipo_instalador: "Instalador" as CreateInstaladorInput["tipo"],
        telefono: "",
        correo: "",
        ubicacion: "",
        notas: "",
        descripcion_proveedor: "",
        costo_instalacion: 0,
        estatus: "Activo",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    function setField(key: string, value: string | number) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: "" }));
        setTouched((prev) => ({ ...prev, [key]: true }));
    }

    function getFieldClass(key: string) {
        if (errors[key]) return FIELD_ERROR;
        if (touched[key]) {
            const val = form[key as keyof typeof form];
            if (key === "correo" && typeof val === "string" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "";
            if (key === "correo" && typeof val === "string" && val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return FIELD_SUCCESS;
            if (key === "telefono" && typeof val === "string" && val && val.length > 20) return "";
            if (key === "telefono" && typeof val === "string" && val && val.length <= 20) return FIELD_SUCCESS;
            if (typeof val === "string" && val.trim()) return FIELD_SUCCESS;
            if (typeof val === "number" && val > 0) return FIELD_SUCCESS;
        }
        return "";
    }

    function validate() {
        if (terceroType !== "Proveedor") return false;

        const next: Record<string, string> = {};
        if (!form.nombre_proveedor.trim()) next.nombre_proveedor = "El nombre es requerido.";
        if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) next.correo = "Correo inválido.";
        if (form.telefono && form.telefono.length > 20) next.telefono = "Máximo 20 caracteres.";

        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (terceroType !== "Proveedor") return;
        if (!validate()) return;
        
        setLoading(true);
        setServerError(null);

        try {
            const endpoint = "/api/proveedores";
            
            const body = {
                nombre_proveedor: form.nombre_proveedor,
                tipo: form.tipo_proveedor,
                telefono: form.telefono || undefined,
                correo: form.correo || undefined,
                descripcion_proveedor: form.descripcion_proveedor || undefined,
                ubicacion: form.ubicacion || undefined,
                estatus: form.estatus,
            };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setServerError(data?.error ?? `Error ${res.status}`);
                return;
            }

            const { data } = await res.json();
            window.alert("Proveedor registrado correctamente");
            
            const newRow: TerceroCardProps & { id: number } = {
                id: data.id_proveedor,
                companyName: data.nombre_proveedor,
                contactName: data.nombre_proveedor,
                location: data.ubicacion ?? "",
                role: "Proveedor",
                status: data.estatus === "Activo" ? "Activo" : "Inactivo",
                email: data.correo ?? "",
                phone: data.telefono ?? "",
            };
            
            onCreated(newRow);
            onClose();
        } catch {
            setServerError("Error de red. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex bg-[#f1f3f5] p-1.5 rounded-full mb-4 shadow-inner">
                <button
                    type="button"
                    onClick={() => {
                        setTerceroType("Proveedor");
                        setErrors({});
                    }}
                    className={`flex-1 py-2 text-[14px] font-medium rounded-full transition-all duration-300 ${
                        terceroType === "Proveedor" 
                            ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#006aff] scale-100" 
                            : "text-[#575757] hover:text-[#1e1e1e] hover:bg-[#e8ecef] scale-[0.98]"
                    }`}
                >
                    Proveedor
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setTerceroType("Instalador");
                        setErrors({});
                    }}
                    className={`flex-1 py-2 text-[14px] font-medium rounded-full transition-all duration-300 ${
                        terceroType === "Instalador" 
                            ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#006aff] scale-100" 
                            : "text-[#575757] hover:text-[#1e1e1e] hover:bg-[#e8ecef] scale-[0.98]"
                    }`}
                >
                    Instalador
                </button>
            </div>

            {serverError && (
                <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
                    {serverError}
                </div>
            )}

            {terceroType === "Proveedor" ? (
                <>
                    <div className="grid gap-4 grid-cols-1">
                        <div>
                            <label className={LABEL}>
                                Nombre del proveedor <span className="text-[#e42200]">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ej. Empresa SA"
                                value={form.nombre_proveedor}
                                onChange={(e) => setField("nombre_proveedor", e.target.value)}
                                className={`${FIELD} ${getFieldClass("nombre_proveedor")}`}
                            />
                            {errors.nombre_proveedor && <p className={ERROR_MSG}>{errors.nombre_proveedor}</p>}
                        </div>
                    </div>

                    <div className="grid gap-4 grid-cols-1">
                        <div>
                            <label className={LABEL}>
                                Tipo <span className="text-[#e42200]">*</span>
                            </label>
                            <select
                                value={form.tipo_proveedor}
                                onChange={(e) => setField("tipo_proveedor", e.target.value)}
                                className={`${FIELD} ${getFieldClass("tipo_proveedor")}`}
                            >
                                <option value="Proveedor de material">Proveedor de material</option>
                                <option value="Proveedor de servicio">Proveedor de servicio</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Correo</label>
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={form.correo}
                                onChange={(e) => setField("correo", e.target.value)}
                                className={`${FIELD} ${getFieldClass("correo")}`}
                            />
                            {errors.correo && <p className={ERROR_MSG}>{errors.correo}</p>}
                        </div>
                        <div>
                            <label className={LABEL}>Teléfono</label>
                            <input
                                type="tel"
                                placeholder="442 234 5678"
                                value={form.telefono}
                                onChange={(e) => setField("telefono", e.target.value)}
                                className={`${FIELD} ${getFieldClass("telefono")}`}
                            />
                            {errors.telefono && <p className={ERROR_MSG}>{errors.telefono}</p>}
                        </div>
                    </div>

                    <div>
                        <label className={LABEL}>Ubicación</label>
                        <input
                            type="text"
                            placeholder="Ciudad, Estado"
                            value={form.ubicacion}
                            onChange={(e) => setField("ubicacion", e.target.value)}
                            className={`${FIELD} ${getFieldClass("ubicacion")}`}
                        />
                    </div>

                    <div>
                        <label className={LABEL}>Descripción</label>
                        <textarea
                            rows={3}
                            placeholder="Detalles adicionales del proveedor..."
                            value={form.descripcion_proveedor}
                            onChange={(e) => setField("descripcion_proveedor", e.target.value)}
                            className={`${FIELD} ${getFieldClass("descripcion_proveedor")} resize-none`}
                        />
                    </div>
                </>
            ) : null}

            <div className="flex justify-end gap-3 mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors"
                >
                    {terceroType === "Instalador" ? "Cerrar" : "Cancelar"}
                </button>
                {terceroType === "Proveedor" && (
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 text-[14px] font-medium text-white bg-[rgba(0,106,255,0.85)] rounded-[7px] hover:bg-[#006aff] transition-colors disabled:opacity-60"
                    >
                        {loading ? "Guardando..." : "Guardar"}
                    </button>
                )}
            </div>
        </form>
    );
}
