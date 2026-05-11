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
import React from "react";

export interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function MapPinIcon({ size = 14, className, style }: IconProps) {
  return <MapPin size={size} className={className} style={style} />;
}

export function MailIcon({ size = 16, className, style }: IconProps) {
  return <Envelope size={size} className={className} style={style} />;
}

export function PhoneIcon({ size = 16, className, style }: IconProps) {
  return <Phone size={size} className={className} style={style} />;
}

export function EditIcon({ size = 16, className, style }: IconProps) {
  return <PencilSimple size={size} className={className} style={style} />;
}

export function ChevronDownIcon({ size = 10, className, style }: IconProps) {
  return <CaretDown size={size} weight="bold" className={className} style={style} />;
}

export function CheckIcon({ size = 12, className, style }: IconProps) {
  return <Check size={size} weight="bold" className={className} style={style} />;
}

export function SearchIcon({ size = 20, className, style }: IconProps) {
  return <MagnifyingGlass size={size} className={className} style={style} />;
}

export function FilterIcon({ size = 18, className, style }: IconProps) {
  return <Funnel size={size} className={className} style={style} />;
}

export function PlusIcon({ size = 18, className, style }: IconProps) {
  return <Plus size={size} weight="bold" className={className} style={style} />;
}

export function TrashIcon({ size = 16, className, style }: IconProps) {
  return <Trash size={size} className={className} style={style} />;
}

export function PlusBoxIcon({ size = 16, className, style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}
