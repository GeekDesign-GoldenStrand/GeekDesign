import type { UserRole } from "@/types";

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

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
};

const ICON_SIZE = 32;

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <House size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: <CurrencyDollar size={ICON_SIZE} />,
    roles: ["Finanzas"],
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    icon: <Money size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    icon: <Package size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador", "Colaborador"],
  },
  {
    href: "/servicios",
    label: "Servicios",
    icon: <Wrench size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/colaboradores",
    label: "Colaboradores",
    icon: <Users size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/terceros",
    label: "Terceros",
    icon: <UserGear size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: <Handshake size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/maquinas",
    label: "Máquinas",
    icon: <Gear size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
  {
    href: "/materiales",
    label: "Materiales",
    icon: <CubeTransparent size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador", "Colaborador"],
  },
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: <Buildings size={ICON_SIZE} />,
    roles: ["Direccion", "Administrador"],
  },
];
