import {
  CaretDown,
  Check,
  Envelope,
  Funnel,
  MagnifyingGlass,
  MapPin,
  PencilSimple,
  Phone,
  Plus,
  Trash,
} from "@phosphor-icons/react";

export interface IconProps {
  size?: number;
}

export function MapPinIcon({ size = 14 }: IconProps) {
  return <MapPin size={size} />;
}

export function MailIcon({ size = 16 }: IconProps) {
  return <Envelope size={size} />;
}

export function PhoneIcon({ size = 16 }: IconProps) {
  return <Phone size={size} />;
}

export function EditIcon({ size = 16 }: IconProps) {
  return <PencilSimple size={size} />;
}

export function ChevronDownIcon({ size = 10 }: IconProps) {
  return <CaretDown size={size} weight="bold" />;
}

export function CheckIcon({ size = 12 }: IconProps) {
  return <Check size={size} weight="bold" />;
}

export function SearchIcon({ size = 20 }: IconProps) {
  return <MagnifyingGlass size={size} />;
}

export function FilterIcon({ size = 18 }: IconProps) {
  return <Funnel size={size} />;
}

export function PlusIcon({ size = 18 }: IconProps) {
  return <Plus size={size} weight="bold" />;
}

export function TrashIcon({ size = 16 }: IconProps) {
  return <Trash size={size} />;
}
