"use client";

import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MaquinasCustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const nombre = data.nombre_maquina || data.name || payload[0].name;
    const veces = data.veces_usada !== undefined ? data.veces_usada : payload[0].value;

    return (
      <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-1.5">
        <span className="font-bold text-gray-900">{veces} veces usada</span>
        <span className="text-gray-500 text-sm font-medium">({nombre})</span>
      </div>
    );
  }
  return null;
}
