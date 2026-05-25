import fs from "node:fs";
import path from "path";

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";

import { TableCell } from "../atoms/TableCell";
import { formatCurrency, formatDate } from "../constants";
import { TableRow } from "../molecules/TableRow";
import { styles } from "../styles";

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD = "#D97706"; // amber-600 — main accent
const GOLD_LIGHT = "#FEF3C7"; // amber-50 — section fill
const GOLD_DARK = "#92400E"; // amber-900 — text on light fill

// ─── PO-specific stylesheet ───────────────────────────────────────────────────
// Global styles.ts covers page, table skeleton, totals, footer.
// This block adds only what is new or colour-overridden for the PO format.

const po = StyleSheet.create({
  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: GOLD,
    marginBottom: 4,
    textAlign: "right",
  },
  metaTable: {
    marginTop: 6,
    width: 160,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  metaRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  metaLabel: {
    backgroundColor: "#F3F4F6",
    padding: 4,
    width: "40%",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    justifyContent: "center",
  },
  metaLabelText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#4B5563",
  },
  metaValue: {
    padding: 4,
    width: "60%",
    justifyContent: "center",
  },
  metaValueText: {
    fontSize: 7,
    color: "#111827",
  },

  // ── Parties (VENDEDOR / COMPRADOR side by side) ────────────────────────────
  partiesRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  partyBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: GOLD,
  },
  partyBlockLeft: {
    marginRight: 8,
  },
  partyHeader: {
    backgroundColor: GOLD,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  partyHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  partyBody: {
    padding: 8,
  },
  partyField: {
    flexDirection: "row",
    marginBottom: 3,
  },
  partyFieldLabel: {
    width: 60,
    fontSize: 8,
    fontWeight: "bold",
    color: "#6B7280",
  },
  partyFieldValue: {
    flex: 1,
    fontSize: 8,
    color: "#111827",
  },

  // ── Three-field conditions row ─────────────────────────────────────────────
  conditionsRow: {
    flexDirection: "row",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  conditionCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  conditionCellLast: {
    flex: 1,
  },
  conditionHeader: {
    backgroundColor: GOLD_LIGHT,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  conditionHeaderText: {
    fontSize: 7,
    fontWeight: "bold",
    color: GOLD_DARK,
    textAlign: "center",
  },
  conditionBody: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 24,
  },
  conditionBodyText: {
    fontSize: 8,
    color: "#111827",
    textAlign: "center",
  },

  // ── Items table ─────────────────────────────────────────────────────────────
  tableSection: {
    marginBottom: 16,
  },
  tableSectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    backgroundColor: GOLD_LIGHT,
    color: GOLD_DARK,
    padding: 5,
    marginBottom: 0,
  },
  // Gold header cell — mirrors styles.tableColHeader but with GOLD background
  thCell: {
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: GOLD,
    padding: 6,
    justifyContent: "center",
  },
  thText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },

  // ── Notes + Totals row ─────────────────────────────────────────────────────
  bottomRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  notesBlock: {
    flex: 1,
    marginRight: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  notesHeader: {
    backgroundColor: GOLD_LIGHT,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  notesHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: GOLD_DARK,
  },
  notesBody: {
    padding: 8,
    minHeight: 64,
  },
  notesText: {
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.5,
  },
  totalsBlock: {
    width: 200,
  },
});

// ─── Props interface ──────────────────────────────────────────────────────────

export interface POVendor {
  /** Nombre del proveedor o instalador */
  nombre: string;
  empresa?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

export interface POBuyer {
  /** Nombre de la sucursal receptora (Geek Design) */
  nombre_sucursal: string;
  direccion: string;
  telefono?: string | null;
  correo?: string | null;
}

export interface POLineItem {
  /** Código o referencia interna del artículo */
  codigo?: string | null;
  /** Descripción del producto / servicio comprado */
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface PurchaseOrderTemplateProps {
  /** Número único de la orden de compra, e.g. "OC-2026-00001" */
  po_number: string;
  fecha: Date | string;
  /** INCOTERM o condición de entrega pactada */
  condiciones_entrega?: string | null;
  forma_pago?: string | null;
  fecha_envio?: Date | string | null;
  /** Vendedor externo: proveedor o instalador */
  vendedor: POVendor;
  /** Comprador: datos de la sucursal de Geek Design */
  comprador: POBuyer;
  items: POLineItem[];
  notas?: string | null;
  /**
   * Financial totals computed by `calcularTotalesOrden` in pdf-purchase-order.tsx
   * (single source of truth). The template renders them verbatim — no arithmetic here.
   */
  subtotal_general: number;
  iva: number;
  total: number;
}

// ─── Internal sub-components ─────────────────────────────────────────────────
// Kept private to this file — complex enough to extract but not shared yet.

/** Header row: Geek Design logo (left) + PO title / meta table (right). */
function POHeader({
  po_number,
  fecha,
  comprador,
}: {
  po_number: string;
  fecha: Date | string;
  comprador: POBuyer;
}) {
  // Read the logo once as a base64 data URI so react-pdf never tries to
  // fetch() a local file path (Node's fetch doesn't support file:// and logs
  // "fetch failed" before falling back to fs — this avoids that noise entirely).
  const logoSrc = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), "public", "geekdesign.png")).toString("base64")}`;

  return (
    <View style={po.header}>
      {/* Left: company identity */}
      <View style={styles.companyInfo}>
        <View style={styles.logoContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image style={styles.logo} src={logoSrc} />
          <View style={styles.companyTextContainer}>
            <Text style={styles.companyName}>GEEK DESIGN</Text>
          </View>
        </View>
        <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 2 }}>
          {comprador.nombre_sucursal}
        </Text>
        <Text style={styles.companyDetail}>{comprador.direccion}</Text>
        {comprador.telefono && <Text style={styles.companyDetail}>{comprador.telefono}</Text>}
        {comprador.correo && <Text style={styles.companyDetail}>{comprador.correo}</Text>}
      </View>

      {/* Right: PO identity */}
      <View style={{ alignItems: "flex-end" }}>
        <Text style={po.title}>ORDEN DE COMPRA (PO)</Text>
        <View style={po.metaTable}>
          <View style={po.metaRow}>
            <View style={po.metaLabel}>
              <Text style={po.metaLabelText}>No. PO</Text>
            </View>
            <View style={po.metaValue}>
              <Text style={[po.metaValueText, { fontWeight: "bold" }]}>{po_number}</Text>
            </View>
          </View>
          <View style={[po.metaRow, { borderBottomWidth: 0 }]}>
            <View style={po.metaLabel}>
              <Text style={po.metaLabelText}>Fecha</Text>
            </View>
            <View style={po.metaValue}>
              <Text style={po.metaValueText}>{formatDate(new Date(fecha))}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Single field inside a party block — label + value on one row. */
function PartyField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={po.partyField}>
      <Text style={po.partyFieldLabel}>{label}</Text>
      <Text style={po.partyFieldValue}>{value}</Text>
    </View>
  );
}

/** Side-by-side VENDEDOR / COMPRADOR blocks. */
function PartiesSection({ vendedor, comprador }: { vendedor: POVendor; comprador: POBuyer }) {
  return (
    <View style={po.partiesRow}>
      {/* Vendedor — external supplier or installer */}
      <View style={[po.partyBlock, po.partyBlockLeft]}>
        <View style={po.partyHeader}>
          <Text style={po.partyHeaderText}>VENDEDOR</Text>
        </View>
        <View style={po.partyBody}>
          <PartyField label="Nombre:" value={vendedor.nombre} />
          <PartyField label="Empresa:" value={vendedor.empresa} />
          <PartyField label="Dirección:" value={vendedor.direccion} />
          <PartyField label="Teléfono:" value={vendedor.telefono} />
          <PartyField label="Email:" value={vendedor.correo} />
        </View>
      </View>

      {/* Comprador — Geek Design sucursal */}
      <View style={po.partyBlock}>
        <View style={po.partyHeader}>
          <Text style={po.partyHeaderText}>COMPRADOR</Text>
        </View>
        <View style={po.partyBody}>
          <PartyField label="Sucursal:" value={comprador.nombre_sucursal} />
          <PartyField label="Empresa:" value="Geek Design" />
          <PartyField label="Dirección:" value={comprador.direccion} />
          <PartyField label="Teléfono:" value={comprador.telefono} />
          <PartyField label="Email:" value={comprador.correo} />
        </View>
      </View>
    </View>
  );
}

/** Three-cell row: INCOTERM | Forma de pago | Fecha de envío. */
function ConditionsRow({
  condiciones_entrega,
  forma_pago,
  fecha_envio,
}: {
  condiciones_entrega?: string | null;
  forma_pago?: string | null;
  fecha_envio?: Date | string | null;
}) {
  return (
    <View style={po.conditionsRow}>
      <View style={po.conditionCell}>
        <View style={po.conditionHeader}>
          <Text style={po.conditionHeaderText}>CONDICIONES DE ENTREGA</Text>
        </View>
        <View style={po.conditionBody}>
          <Text style={po.conditionBodyText}>{condiciones_entrega ?? "—"}</Text>
        </View>
      </View>
      <View style={po.conditionCell}>
        <View style={po.conditionHeader}>
          <Text style={po.conditionHeaderText}>FORMA DE PAGO</Text>
        </View>
        <View style={po.conditionBody}>
          <Text style={po.conditionBodyText}>{forma_pago ?? "—"}</Text>
        </View>
      </View>
      <View style={po.conditionCellLast}>
        <View style={po.conditionHeader}>
          <Text style={po.conditionHeaderText}>FECHA DE ENVÍO</Text>
        </View>
        <View style={po.conditionBody}>
          <Text style={po.conditionBodyText}>
            {fecha_envio ? formatDate(new Date(fecha_envio)) : "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Gold-header items table. Header cells rendered inline; data cells via TableCell atom. */
function ItemsTable({ items }: { items: POLineItem[] }) {
  return (
    <View style={po.tableSection}>
      <Text style={po.tableSectionTitle}>ARTÍCULOS / SERVICIOS</Text>
      <View style={styles.table}>
        {/* Header row — gold background, rendered directly to override the red default */}
        <TableRow>
          <View style={[po.thCell, { width: "8%" }]}>
            <Text style={po.thText}>#</Text>
          </View>
          <View style={[po.thCell, { width: "17%" }]}>
            <Text style={po.thText}>CÓDIGO</Text>
          </View>
          <View style={[po.thCell, { width: "35%" }]}>
            <Text style={po.thText}>DESCRIPCIÓN</Text>
          </View>
          <View style={[po.thCell, { width: "12%" }]}>
            <Text style={po.thText}>CANT.</Text>
          </View>
          <View style={[po.thCell, { width: "14%" }]}>
            <Text style={po.thText}>PRECIO U.</Text>
          </View>
          <View style={[po.thCell, { width: "14%", borderRightWidth: 0 }]}>
            <Text style={po.thText}>SUBTOTAL</Text>
          </View>
        </TableRow>

        {/* Data rows — reuse existing TableCell atom */}
        {items.map((item, index) => (
          <TableRow key={index}>
            <TableCell width="8%">
              <Text style={[styles.tableCell, { textAlign: "center" }]}>{index + 1}</Text>
            </TableCell>
            <TableCell width="17%">
              <Text style={styles.tableCell}>{item.codigo ?? "—"}</Text>
            </TableCell>
            <TableCell width="35%">
              <Text style={styles.tableCell}>{item.descripcion}</Text>
            </TableCell>
            <TableCell width="12%">
              <Text style={[styles.tableCell, { textAlign: "center" }]}>{item.cantidad}</Text>
            </TableCell>
            <TableCell width="14%">
              <Text style={[styles.tableCell, { textAlign: "right" }]}>
                {formatCurrency(item.precio_unitario)}
              </Text>
            </TableCell>
            <TableCell width="14%">
              <Text style={[styles.tableCell, { textAlign: "right" }]}>
                {formatCurrency(item.subtotal)}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </View>
    </View>
  );
}

/** Notes (left) + Subtotal / IVA / Total (right). */
function BottomSection({
  notas,
  subtotal_general,
  iva,
  total,
}: {
  notas?: string | null;
  subtotal_general: number;
  iva: number;
  total: number;
}) {
  return (
    <View style={po.bottomRow}>
      {/* Notes */}
      <View style={po.notesBlock}>
        <View style={po.notesHeader}>
          <Text style={po.notesHeaderText}>NOTAS</Text>
        </View>
        <View style={po.notesBody}>
          {notas ? (
            <Text style={po.notesText}>{notas}</Text>
          ) : (
            <Text style={[po.notesText, { color: "#9CA3AF" }]}>Sin notas adicionales.</Text>
          )}
        </View>
      </View>

      {/* Totals — reuses the shared totals styles from styles.ts */}
      <View style={po.totalsBlock}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal_general)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA (16%):</Text>
          <Text style={styles.totalValue}>{formatCurrency(iva)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={[styles.totalLabel, { color: GOLD }]}>Total:</Text>
          <Text style={[styles.totalValue, { color: GOLD }]}>{formatCurrency(total)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main template ────────────────────────────────────────────────────────────

export function PurchaseOrderTemplate({
  po_number,
  fecha,
  condiciones_entrega,
  forma_pago,
  fecha_envio,
  vendedor,
  comprador,
  items,
  notas,
  subtotal_general,
  iva,
  total,
}: PurchaseOrderTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <POHeader po_number={po_number} fecha={fecha} comprador={comprador} />

        <PartiesSection vendedor={vendedor} comprador={comprador} />

        <ConditionsRow
          condiciones_entrega={condiciones_entrega}
          forma_pago={forma_pago}
          fecha_envio={fecha_envio}
        />

        <ItemsTable items={items} />

        <BottomSection notas={notas} subtotal_general={subtotal_general} iva={iva} total={total} />

        <Text
          style={styles.pageFooter}
          render={({ pageNumber, totalPages }) =>
            `GEEK DESIGN - Av. Mediterráneo 236 B Fracc. Pirámides. Villa corregidora Querétaro  |  Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
