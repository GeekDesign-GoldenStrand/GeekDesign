"use client";

import type { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "pill";
  style?: CSSProperties;
}

const ROUNDED: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  pill: "rounded-full",
};

export function Skeleton({
  className = "",
  width,
  height = 16,
  rounded = "sm",
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse bg-surface-sunken ${ROUNDED[rounded]} ${className}`}
      style={{ width, height, ...style }}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = "" }: SkeletonTextProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? "60%" : "100%"} rounded="sm" />
      ))}
    </div>
  );
}
