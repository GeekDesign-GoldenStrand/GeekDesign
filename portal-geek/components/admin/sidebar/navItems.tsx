import {
  Buildings,
  CubeTransparent,
  CurrencyDollar,
  Gear,
  Handshake,
  House,
  Money,
  Package,
  UserGear,
  Users,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";

import type { Section } from "@/lib/auth/access";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  // The policy section this item links to. Visibility is derived from
  // can(role, section, "read") — see SidebarNav. Omit for items visible to any
  // authenticated user (e.g. Dashboard).
  section?: Section;
};

const ICON_SIZE = 32;

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <House size={ICON_SIZE} />,
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: <CurrencyDollar size={ICON_SIZE} />,
    section: "finanzas",
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    icon: <Money size={ICON_SIZE} />,
    section: "cotizaciones",
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    icon: <Package size={ICON_SIZE} />,
    section: "pedidos",
  },
  {
    href: "/servicios",
    label: "Servicios",
    icon: <Wrench size={ICON_SIZE} />,
    section: "servicios",
  },
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
    href: "/clientes",
    label: "Clientes",
    icon: <Handshake size={ICON_SIZE} />,
    section: "clientes",
  },
  {
    href: "/maquinas",
    label: "Máquinas",
    icon: <Gear size={ICON_SIZE} />,
    section: "maquinas",
  },
  {
    href: "/materiales",
    label: "Materiales",
    icon: <CubeTransparent size={ICON_SIZE} />,
    section: "materiales",
  },
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: <Buildings size={ICON_SIZE} />,
    section: "sucursales",
  },
];
