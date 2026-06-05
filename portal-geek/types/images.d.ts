// Local module declarations for static image assets imported via the
// `@/public/...` alias. Next.js auto-declares these via
// `next/image-types/global` (referenced from next-env.d.ts), but that path
// isn't always available during CI tsc runs — `.next/dev/types/routes.d.ts`
// is only produced by `next dev`, and its absence can short-circuit
// next-env.d.ts processing entirely. Declaring the modules here makes the
// project's image imports type-check independently of Next's generated
// scaffolding.

declare module "*.svg" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.png" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.jpg" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.jpeg" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.gif" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.webp" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.avif" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.ico" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.bmp" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}
