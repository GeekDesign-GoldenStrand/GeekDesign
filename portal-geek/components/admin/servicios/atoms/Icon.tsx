"use client";
import type { IconProps, Icon as PhosphorIcon } from "@phosphor-icons/react";

interface Props extends IconProps {
  LibIcon: PhosphorIcon;
}

export function Icon({ LibIcon, size = 24, weight = "regular", ...props }: Props) {
  return <LibIcon size={size} weight={weight} {...props} />;
}
