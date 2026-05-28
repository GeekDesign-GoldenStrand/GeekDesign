import {
  Buildings,
  CubeTransparent,
  CurrencyDollar,
  Handshake,
  Briefcase,
  Package,
  UserGear,
  Users,
  Storefront,
  PresentationChart,
} from "@phosphor-icons/react/dist/ssr";

import { MaquinaIcon } from "@/components/admin/sidebar/atoms/MaquinaIcon";
import type { Section } from "@/lib/auth/access";

export type NavItem =
  | {
      type?: "link";
      href: string;
      label: string;
      icon: React.ReactNode;
      // Optional active-state icon. Used for non-Phosphor icons (custom SVG
      // assets) that can't pick up the active state via `weight: "fill"`.
      // Phosphor entries leave this undefined and rely on NavLink's
      // cloneElement weight swap.
      iconActive?: React.ReactNode;
      // Optional hover-state icon. Same rationale as iconActive — Phosphor
      // entries get hover via currentColor on the parent link; custom SVGs
      // need a dedicated asset.
      iconHover?: React.ReactNode;
      // The policy section this item links to. Visibility is derived from
      // can(role, section, "read") — see SidebarNav. Omit for items visible to
      // any authenticated user.
      section?: Section;
    }
  | {
      type: "divider";
    };

const ICON_SIZE = 30;

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <PresentationChart size={ICON_SIZE} />,
    // The dashboard is the company-wide metrics home, so it's Direccion-only.
    // Colaborador/Finanzas don't see it and land on their own section instead.
    section: "metricas",
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    icon: <Briefcase size={ICON_SIZE} />,
    section: "cotizaciones",
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    icon: <Package size={ICON_SIZE} />,
    section: "pedidos",
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: <CurrencyDollar size={ICON_SIZE} />,
    section: "finanzas",
  },
  { type: "divider" },
  {
    href: "/servicios",
    label: "Servicios",
    icon: <Storefront size={ICON_SIZE} />,
    section: "servicios",
  },
  {
    href: "/materiales",
    label: "Materiales",
    icon: <CubeTransparent size={ICON_SIZE} />,
    section: "materiales",
  },
  {
    href: "/maquinas",
    label: "Máquinas",
    // Inline SVG component (not Phosphor) whose path uses `fill="currentColor"`,
    // so it picks up the NavLink's text color for idle / hover / active states
    // just like the Phosphor entries — no separate -hover / -fill assets needed.
    icon: <MaquinaIcon size={ICON_SIZE} />,
    section: "maquinas",
  },
  { type: "divider" },
  {
    href: "/colaboradores",
    label: "Colaboradores",
    icon: <Users size={ICON_SIZE} />,
    section: "colaboradores",
  },
  {
    href: "/terceros",
    label: "Terceros",
    icon: <UserGear size={ICON_SIZE} />,
    section: "terceros",
  },
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: <Buildings size={ICON_SIZE} />,
    section: "sucursales",
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: <Handshake size={ICON_SIZE} />,
    section: "clientes",
  },
];
