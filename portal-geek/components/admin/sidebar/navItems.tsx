import {
  CubeTransparent,
  Buildings,
  CurrencyDollar,
  Gear,
  Handshake,
  House,
  Package,
  UserGear,
  Users,
} from "@phosphor-icons/react/dist/ssr";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <House />,
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: <CurrencyDollar />,
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    icon: (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <rect x="4" y="10" width="32" height="20" rx="3" />
        <circle cx="20" cy="20" r="5" />
        <path d="M8 15h4M28 15h4M8 25h4M28 25h4" />
      </svg>
    ),
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    icon: <Package />,
  },
  {
    href: "/colaboradores",
    label: "Colaboradores",
    icon: <Users />,
  },
  {
    href: "/terceros",
    label: "Terceros",
    icon: <UserGear />,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: <Handshake />,
  },
  {
    href: "/maquinas",
    label: "Máquinas",
    icon: <Gear />,
  },
  {
    href: "/materiales",
    label: "Materiales",
    icon: <CubeTransparent />,
  },
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: <Buildings />,
  },
];
