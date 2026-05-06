import {
  BuildingsIcon,
  CurrencyDollarIcon,
  GearIcon,
  HandshakeIcon,
  HouseIcon,
  PackageIcon,
  UserGearIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const ICON_SIZE = 44;

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <HouseIcon size={ICON_SIZE} />,
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: <CurrencyDollarIcon size={ICON_SIZE} />,
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer rectangle like a bill */}
        <rect x="4" y="10" width="32" height="20" rx="3" />
        {/* Circle in the middle to represent a coin */}
        <circle cx="20" cy="20" r="5" />
        {/* Small lines for detail */}
        <path d="M8 15h4M28 15h4M8 25h4M28 25h4" />
      </svg>
    ),
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    icon: <PackageIcon size={ICON_SIZE} />,
  },
  {
    href: "/colaboradores",
    label: "Colaboradores",
    icon: <UsersIcon size={ICON_SIZE} />,
  },
  {
    href: "/terceros",
    label: "Terceros",
    icon: <UserGearIcon size={ICON_SIZE} />,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: <HandshakeIcon size={ICON_SIZE} />,
  },
  {
    href: "/maquinas",
    label: "Máquinas",
    icon: <GearIcon size={ICON_SIZE} />,
  },
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: <BuildingsIcon size={ICON_SIZE} />,
  },
];
