"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";

/**
 * Organism: FolioSearch
 *
 * KIKW12 review #1b/#2: cliente enters folio + email; we POST to the
 * access-link endpoint which silently emails a magic link if the pair matches.
 * The response is always the same generic message — never reveals whether the
 * folio exists or which email it belongs to.
 *
 * Replaces the previous "set client_email / client_folio plaintext cookies and
 * redirect" flow, which let anyone with knowledge of the cliente's email
 * impersonate them on approve/cancel.
 */
export function FolioSearch() {
  const [folio, setFolio] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = folio.trim();
    const m = email.trim();
    if (!f || !m) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      await fetch(`/api/storefront/cotizaciones/${encodeURIComponent(f)}/access-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_electronico: m }),
      });
      // Generic confirmation regardless of outcome (anti-enumeration).
      setFeedback("Si los datos son correctos, te enviamos un correo con el enlace de acceso.");
    } catch {
      setFeedback("No pudimos procesar la solicitud. Intenta de nuevo en unos minutos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto py-12 px-4">
      <div className="bg-white rounded-[24px] border border-[#E8E8E8] shadow-[0_12px_60px_rgba(0,0,0,0.03)] p-10 md:p-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 text-center lg:text-left space-y-4">
          <h2 className="text-[36px] md:text-[42px] font-black text-[#1e1e1e] leading-tight">
            Consulta tu cotización
          </h2>
          <p className="text-[#8e908f] text-[18px] md:text-[20px] font-medium max-w-[450px]">
            Ingresa tu folio y correo. Te enviaremos un enlace de un solo uso para acceder.
          </p>
        </div>

        <div className="hidden lg:block w-[1.5px] h-[120px] bg-[#F0F0F0]" />

        <div className="w-full lg:w-auto md:min-w-[500px] space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#1e1e1e] uppercase tracking-[1.5px]">
                  Folio de cotización
                </label>
                <input
                  type="text"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  placeholder="GD-2026-00203"
                  required
                  className="w-full h-[64px] bg-white border border-[#E8E8E8] rounded-[12px] px-6 text-[18px] font-bold text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#DF2646] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#1e1e1e] uppercase tracking-[1.5px]">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full h-[64px] bg-white border border-[#E8E8E8] rounded-[12px] px-6 text-[18px] font-bold text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#DF2646] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[64px] bg-[#DF2646] text-white rounded-[12px] font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-[#C41E3A] transition-all shadow-lg shadow-[#DF2646]/20 active:scale-95 whitespace-nowrap disabled:opacity-60"
            >
              <MagnifyingGlass size={22} weight="bold" />
              {submitting ? "Enviando..." : "Enviar enlace de acceso"}
            </button>
          </form>
          {feedback && (
            <p className="text-[14px] text-[#1e1e1e] font-medium text-center lg:text-left">
              {feedback}
            </p>
          )}
          <p className="text-[13px] text-[#B9B8B8] font-medium text-center lg:text-left">
            El folio está en el correo de confirmación de tu solicitud.
          </p>
        </div>
      </div>
    </div>
  );
}
