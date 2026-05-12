export const MOCK_SCENARIOS: Record<string, any> = {
  "203": {
    id: "203",
    fecha_solicitud: "12 de mayo, 2024 · 10:24 a.m.",
    estado_actual: "modificada",
    pasos: [
      { label: "Solicitud enviada", fecha: "12 mayo", completado: true },
      { label: "Validación Geek", fecha: "13 mayo", completado: true },
      { label: "En revisión", fecha: "Hoy", actual: true, completado: false },
      { label: "Confirmada", fecha: "Pendiente", completado: false }
    ],
    servicios: [
      { id: 1, nombre: "Playeras Polo", descripcion: "Lote 50 Piezas", estado: "sin_cambios", precio_anterior: 8500, precio_nuevo: 8500, motivo: null, detalles_cliente: "Tallas M y L." },
      { id: 2, nombre: "Vinil Fachada", descripcion: "Instalación", estado: "modificado", precio_anterior: 4200, precio_nuevo: 5800, cambio: "+38%", motivo: "Ajuste de metraje.", detalles_cliente: "Ventana principal." },
      { id: 4, nombre: "Stand Expo", descripcion: "Renta Truss", estado: "rechazado", precio_anterior: 15000, precio_nuevo: null, motivo: "Sin stock.", detalles_cliente: "Expo Industriales." }
    ],
    resumen: { total_anterior: 27700, total_nuevo: 14300, diferencia: 1600, porcentaje: "+11.2%" }
  },
  "validada": {
    id: "VAL-100",
    fecha_solicitud: "15 de mayo, 2024 · 09:00 a.m.",
    estado_actual: "aceptada_sin_cambios",
    pasos: [
      { label: "Solicitud enviada", fecha: "15 mayo", completado: true },
      { label: "Validación Geek", fecha: "16 mayo", completado: true },
      { label: "Lista para aceptar", fecha: "Hoy", actual: true, completado: false },
      { label: "Confirmada", fecha: "Pendiente", completado: false }
    ],
    servicios: [
      { id: 1, nombre: "Tarjetas de Presentación", descripcion: "1000 unidades", estado: "sin_cambios", precio_anterior: 1200, precio_nuevo: 1200, motivo: null, detalles_cliente: "Papel couché 350g." },
      { id: 2, nombre: "Diseño de Logotipo", descripcion: "Propuesta 3 conceptos", estado: "sin_cambios", precio_anterior: 3500, precio_nuevo: 3500, motivo: null, detalles_cliente: "Estilo moderno." }
    ],
    resumen: { total_anterior: 4700, total_nuevo: 4700, diferencia: 0, porcentaje: "0%" }
  },
  "modificada": {
    id: "MOD-500",
    fecha_solicitud: "10 de mayo, 2024 · 11:30 a.m.",
    estado_actual: "modificada",
    pasos: [
      { label: "Solicitud enviada", fecha: "10 mayo", completado: true },
      { label: "Validación Geek", fecha: "12 mayo", completado: true },
      { label: "Revisar cambios", fecha: "Hoy", actual: true, completado: false },
      { label: "Confirmada", fecha: "Pendiente", completado: false }
    ],
    servicios: [
      { id: 1, nombre: "Letrero Luminoso LED", descripcion: "1.5m x 0.5m", estado: "modificado", precio_anterior: 7000, precio_nuevo: 8500, cambio: "+21%", motivo: "Incremento en costo de acrílico.", detalles_cliente: "Iluminación blanca." },
      { id: 2, nombre: "Instalación Eléctrica", descripcion: "Punto de conexión", estado: "modificado", precio_anterior: 1500, precio_nuevo: 2200, cambio: "+46%", motivo: "Requiere cableado de mayor calibre.", detalles_cliente: "Caja de fusibles a letrero." }
    ],
    resumen: { total_anterior: 8500, total_nuevo: 10700, diferencia: 2200, porcentaje: "+25.8%" }
  },
  "rechazada": {
    id: "REJ-999",
    fecha_solicitud: "08 de mayo, 2024 · 16:45 p.m.",
    estado_actual: "rechazada",
    pasos: [
      { label: "Solicitud enviada", fecha: "08 mayo", completado: true },
      { label: "Validación Geek", fecha: "09 mayo", completado: true },
      { label: "No disponible", fecha: "Hoy", actual: true, completado: false },
      { label: "Finalizado", fecha: "Cerrado", completado: false }
    ],
    servicios: [
      { id: 1, nombre: "Estructura para Eventos", descripcion: "Escenario móvil", estado: "rechazado", precio_anterior: 25000, precio_nuevo: null, motivo: "Mantenimiento preventivo en esas fechas.", detalles_cliente: "Evento al aire libre." }
    ],
    resumen: { total_anterior: 25000, total_nuevo: 0, diferencia: -25000, porcentaje: "-100%" }
  },
  "revision": {
    id: "REV-001",
    fecha_solicitud: "12 de mayo, 2024 · 10:24 a.m.",
    estado_actual: "en_revision",
    pasos: [
      { label: "Solicitud enviada", fecha: "12 mayo", completado: true },
      { label: "Revisión en curso", fecha: "Hoy", actual: true, completado: false },
      { label: "Validación final", fecha: "Pendiente", completado: false },
      { label: "Lista para aceptar", fecha: "Pendiente", completado: false }
    ],
    servicios: [
      { id: 1, nombre: "Tazas Personalizadas", descripcion: "Lote 100 Piezas", estado: "sin_cambios", precio_anterior: 4500, precio_nuevo: 4500, motivo: null, detalles_cliente: "Logo a dos tintas." }
    ],
    resumen: { total_anterior: 4500, total_nuevo: 4500, diferencia: 0, porcentaje: "0%" }
  }
};
