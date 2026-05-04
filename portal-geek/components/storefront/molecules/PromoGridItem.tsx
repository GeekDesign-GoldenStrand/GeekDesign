"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface PromoGridItemProps {
  title: React.ReactNode;
  alt?: string;
  description?: string;
  imageUrl?: string;
  href: string;
  className?: string;
  type?: "image" | "text";
  bgClassName?: string;
  delay?: number;
  priority?: boolean;
  ctaText?: string;
}

export function PromoGridItem({
  title,
  alt,
  description,
  imageUrl,
  href,
  className = "",
  type = "image",
  bgClassName = "bg-gray-50",
  delay = 0,
  priority = false,
  ctaText = "Explorar",
}: PromoGridItemProps) {
  const imageAlt = alt || (typeof title === "string" ? title : "Producto Promocional");

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
      className={`relative group overflow-hidden ${bgClassName} ${className}`}
    >
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block w-full h-full"
      >
        {type === "image" && imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-500"></div>
            <div className="absolute bottom-10 left-10 text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 whitespace-pre-line">{title}</h2>
              <div className="flex items-center gap-4 group-hover:translate-x-2 transition-transform duration-300">
                <span className="text-xs uppercase tracking-widest font-bold">{ctaText}</span>
                <div className="w-12 h-[1px] bg-white"></div>
                <ArrowRight size={20} weight="bold" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center p-12 h-full">
            <span className="text-black text-xs font-bold tracking-widest uppercase mb-6">
              Creatividad
            </span>
            <h3
              className="text-3xl font-medium text-black mb-8 leading-tight"
              style={{ fontFamily: "var(--font-alexandria), sans-serif" }}
            >
              {title}
            </h3>
            {description && (
              <p className="text-black text-sm mb-10 leading-relaxed font-medium opacity-70">
                {description}
              </p>
            )}
            <div className="text-sm font-bold uppercase tracking-[0.2em] border-b border-black text-black w-fit pb-1 hover:opacity-40 transition-all">
              {ctaText}
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );

  return content;
}
