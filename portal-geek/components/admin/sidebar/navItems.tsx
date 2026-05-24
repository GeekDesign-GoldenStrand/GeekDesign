import {
  Buildings,
  CubeTransparent,
  CurrencyDollar,
  Microscope,
  Handshake,
  Briefcase,
  Package,
  UserGear,
  Users,
  Storefront,
  PresentationChart,
} from "@phosphor-icons/react/dist/ssr";

import type { Section } from "@/lib/auth/access";

export type NavItem =
  | {
      type?: "link";
      href: string;
      label: string;
      icon: React.ReactNode;
      // The policy section this item links to. Visibility is derived from
      // can(role, section, "read") — see SidebarNav. Omit for items visible to
      // any authenticated user (e.g. Dashboard).
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
    icon: <Microscope size={ICON_SIZE} />,
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
