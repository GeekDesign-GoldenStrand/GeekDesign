"use client";

import type { ReactNode } from "react";

import { formatPhoneNumber } from "@/lib/utils/format";

import { ActionButton, ActionLink } from "./ActionButton";
import { EditIcon, MailIcon, PhoneIcon, TrashIcon } from "./icons";

interface EntityCardProps {
  children: ReactNode;
  className?: string;
  gap?: string;
}

export function EntityCard({ children, className, gap = "gap-2.5" }: EntityCardProps) {
  return (
    <div
      className={[
        "bg-white rounded-[7px] shadow-[0_0_20px_rgba(0,0,0,0.25)] p-4 flex flex-col w-full font-ibm-plex",
        gap,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-semibold text-[24px] text-[#1e1e1e] leading-tight break-words">
      {children}
    </h3>
  );
}

function Subtitle({ children }: { children: ReactNode }) {
  return <p className="font-medium text-[18px] text-[#424242] break-words">{children}</p>;
}

function IconRow({
  icon,
  children,
  className,
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex items-center gap-2 text-[16px] font-medium text-[#1e1e1e] min-w-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate min-w-0">{children}</span>
    </div>
  );
}

function TagRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 flex-wrap">{children}</div>;
}

function Contact({ email, phone }: { email?: string | null; phone?: string | null }) {
  return (
    <>
      {email && (
        <div className="flex items-center gap-2 text-[#1e1e1e] font-medium text-[16px] min-w-0">
          <MailIcon size={16} className="shrink-0" />
          <a href={`mailto:${email}`} className="lowercase hover:opacity-70 truncate">
            {email}
          </a>
        </div>
      )}
      {phone && (
        <div className="flex items-center gap-2 text-[#1e1e1e] font-medium text-[16px] min-w-0">
          <PhoneIcon size={16} className="shrink-0" />
          <span className="truncate">{formatPhoneNumber(phone)}</span>
        </div>
      )}
    </>
  );
}

interface ActionsProps {
  email?: string | null;
  phone?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  children?: ReactNode;
}

function Actions({
  email,
  phone,
  onEdit,
  onDelete,
  editLabel = "Editar",
  deleteLabel = "Eliminar",
  children,
}: ActionsProps) {
  return (
    <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
      <ActionLink
        href={phone ? `tel:${phone}` : undefined}
        icon={<PhoneIcon size={16} />}
        label="Llamar"
      />
      <ActionLink
        href={email ? `mailto:${email}` : undefined}
        icon={<MailIcon size={16} />}
        label="Mail"
      />
      {children}
      {onEdit && (
        <ActionButton onClick={onEdit} aria-label={editLabel} icon={<EditIcon size={16} />} />
      )}
      {onDelete && (
        <ActionButton
          tone="danger"
          onClick={onDelete}
          aria-label={deleteLabel}
          icon={<TrashIcon size={16} />}
        />
      )}
    </div>
  );
}

EntityCard.Title = Title;
EntityCard.Subtitle = Subtitle;
EntityCard.IconRow = IconRow;
EntityCard.TagRow = TagRow;
EntityCard.Contact = Contact;
EntityCard.Actions = Actions;
