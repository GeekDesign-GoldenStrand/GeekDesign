"use client";

import { useRef } from "react";

import { Toggle } from "@/components/admin/servicios/atoms/Toggle";
import type { VariableDraft } from "./VariablesSection";
import type { ConstanteDraft } from "./ConstantesSection";

type FormulaSectionProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  expresion: string;
  onExpresionChange: (value: string) => void;
  variables: VariableDraft[];
  constantes: ConstanteDraft[];
};

export function FormulaSection({
  enabled,
  onToggle,
  expresion,
  onExpresionChange,
  variables,
  constantes,
}: FormulaSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert an identifier at the current cursor position in the textarea.
  const insertarIdentificador = (id: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onExpresionChange(expresion ? `${expresion} ${id}` : id);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = expresion.substring(0, start);
    const after = expresion.substring(end);

    const needsSpaceBefore =
      before.length > 0 && !/[\s(+\-*/]$/.test(before);
    const needsSpaceAfter = after.length > 0 && !/^[\s)+\-*/]/.test(after);

    const insertion = `${needsSpaceBefore ? " " : ""}${id}${
      needsSpaceAfter ? " " : ""
    }`;
    const newValue = before + insertion + after;

    onExpresionChange(newValue);

    requestAnimationFrame(() => {
      const newCursorPos = before.length + insertion.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  // Insert an operator/symbol at cursor position.
  const insertarSimbolo = (simbolo: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onExpresionChange(expresion + simbolo);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = expresion.substring(0, start);
    const after = expresion.substring(end);
    const newValue = before + simbolo + after;

    onExpresionChange(newValue);

    requestAnimationFrame(() => {
      const newCursorPos = before.length + simbolo.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1e1e1e]">
            Fórmula de cotización:
          </h3>
          <Toggle checked={enabled} onChange={onToggle} />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          La expresión matemática que calcula el precio del servicio combinando
          variables y constantes.
        </p>
        <p className="text-xs text-gray-500 italic mt-1">
          Ejemplo: <code>(ancho * altura * costo_m2) * iva</code>
        </p>
      </div>

      {enabled && (
        <>
          {(variables.length > 0 || constantes.length > 0) && (
            <div className="flex flex-col gap-2 bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs font-medium text-blue-900">
                Click en un identificador para insertarlo en la fórmula:
              </p>

              {variables.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-blue-700 font-medium">
                    Variables:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.map((v) => (
                      <button
                        key={v.nombre_variable}
                        type="button"
                        onClick={() => insertarIdentificador(v.nombre_variable)}
                        className="text-xs bg-white border border-blue-300 hover:bg-blue-100 hover:border-blue-500 transition-colors px-2 py-1 rounded font-mono text-blue-900"
                        title={v.etiqueta}
                      >
                        {v.nombre_variable}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {constantes.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-blue-700 font-medium">
                    Constantes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {constantes.map((c) => (
                      <button
                        key={c.nombre_constante}
                        type="button"
                        onClick={() =>
                          insertarIdentificador(c.nombre_constante)
                        }
                        className="text-xs bg-white border border-blue-300 hover:bg-blue-100 hover:border-blue-500 transition-colors px-2 py-1 rounded font-mono text-blue-900"
                      >
                        {c.nombre_constante}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 pt-2 border-t border-blue-200">
                <span className="text-xs text-blue-700 font-medium">
                  Operadores:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["+", "-", "*", "/", "(", ")"].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => insertarSimbolo(op)}
                      className="text-xs bg-white border border-blue-300 hover:bg-blue-100 hover:border-blue-500 transition-colors px-2.5 py-1 rounded font-mono text-blue-900 min-w-[28px]"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {variables.length === 0 && constantes.length === 0 && (
            <p className="text-xs text-gray-500 italic bg-gray-50 border border-gray-200 rounded-md p-3">
              Agrega al menos una variable o constante arriba para empezar a
              construir la fórmula.
            </p>
          )}

          <textarea
            ref={textareaRef}
            value={expresion}
            onChange={(e) => onExpresionChange(e.target.value)}
            placeholder="Click en los identificadores arriba o escribe la fórmula manualmente..."
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-[#1e1e1e] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent resize-none"
          />

          <p className="text-xs text-gray-500">
            Máximo 500 caracteres. Operadores soportados:{" "}
            <code>+ - * / ( )</code>
          </p>
        </>
      )}
    </div>
  );
}