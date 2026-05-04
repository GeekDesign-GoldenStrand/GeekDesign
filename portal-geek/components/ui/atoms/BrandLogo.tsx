import Image from "next/image";

export function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <Image src="/images/login/logo.png" alt="Geek Design" width={46} height={46} priority />
      <span className="font-alexandria font-semibold text-[20px] tracking-[1px] text-[#df2646]">
        GEEK DESIGN
      </span>
    </div>
  );
}
