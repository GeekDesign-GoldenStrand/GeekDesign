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
import Image from "next/image";

import type { Section } from "@/lib/auth/access";
import maquina_icono from "@/public/maquina icono.svg";
import maquina_icono_fill from "@/public/maquina-icono-fill.svg";
import maquina_icono_hover from "@/public/maquina-icono-hover.svg";

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
    // Custom SVG asset (not Phosphor) — wrap in <Image> so it's a valid React
    // child, and supply separate `iconHover`/`iconActive` variants since
    // NavLink's color/weight swap doesn't apply to <Image>.
    icon: <Image src={maquina_icono} alt="" width={ICON_SIZE} height={ICON_SIZE} />,
    iconHover: <Image src={maquina_icono_hover} alt="" width={ICON_SIZE} height={ICON_SIZE} />,
    iconActive: <Image src={maquina_icono_fill} alt="" width={ICON_SIZE} height={ICON_SIZE} />,
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
