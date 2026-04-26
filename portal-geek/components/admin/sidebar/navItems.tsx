import { ChartLineIcon, PackageIcon, TruckIcon, WarehouseIcon, AddressBookTabsIcon, ClipboardIcon, UsersIcon, MicroscopeIcon, HandbagSimpleIcon } from "@phosphor-icons/react";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <ChartLineIcon size={32} weight="light" />
    ),
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    icon: (
      <ClipboardIcon size={32} weight="light" />
    ),
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    icon: (
      <HandbagSimpleIcon size={32} weight="light" />
    ),
  },
  {
    href: "/colaboradores",
    label: "Colaboradores",
    icon: (
      <UsersIcon size={32} weight="light" />
    ),
  },
  {
    href: "/terceros",
    label: "Terceros",
    icon: (
      <TruckIcon size={32} weight="light" />
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: (
      <AddressBookTabsIcon size={32} weight="light" />
    ),
  },
  {
    href: "/materiales",
    label: "Materiales",
    icon: (
      <PackageIcon size={32} weight="light" />
    ),
  },
  {
    href: "/maquinas",
    label: "Máquinas",
    icon: (
      <MicroscopeIcon size={32} weight="light" />
    ),
  },
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: (
      <WarehouseIcon size={32} weight="light" />
    ),
  },
];
