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

import type { UserRole } from "@/types";

export type NavItem =
  | {
      type?: "link";
      href: string;
      label: string;
      icon: React.ReactNode;
      roles: UserRole[];
    }
  | {
      type: "divider";
      roles: UserRole[];
    };

const ICON_SIZE = 30;

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <PresentationChart size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    icon: <Briefcase size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    icon: <Package size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador", "Colaborador"],
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: <CurrencyDollar size={ICON_SIZE} />,
    roles: ["Finanzas", "Direccion", "Administrador"],
  },
  {
    type: "divider",
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/servicios",
    label: "Servicios",
    icon: <Storefront size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/terceros",
    label: "Terceros",
    icon: <UserGear size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/materiales",
    label: "Materiales",
    icon: <CubeTransparent size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador", "Colaborador"],
  },
  {
    type: "divider",
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/maquinas",
    label: "Máquinas",
    icon: <Microscope size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/colaboradores",
    label: "Colaboradores",
    icon: <Users size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: <Buildings size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: <Handshake size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
];
