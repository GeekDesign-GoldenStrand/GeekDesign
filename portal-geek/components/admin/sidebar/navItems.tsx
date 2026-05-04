<<<<<<< feature/62-consultar-materiales
import { CubeTransparentIcon } from "@phosphor-icons/react/dist/ssr";
=======
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
>>>>>>> develop

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
    href: "/materiales",
    label: "Materiales",
    icon: <CubeTransparentIcon size={44} />,
  },
  {
    href: "/sucursales",
    label: "Sucursales",
    icon: <BuildingsIcon size={ICON_SIZE} />,
  },
];
