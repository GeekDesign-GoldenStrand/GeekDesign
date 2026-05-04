"use client";

interface EditorialHeadingProps {
  level?: "h1" | "h2" | "h3";
  mainText: string;
  italicText?: string;
  className?: string;
  dark?: boolean;
}

export function EditorialHeading({ 
  level = "h1", 
  mainText, 
  italicText, 
  className = "", 
  dark = false 
}: EditorialHeadingProps) {
  const Tag = level;
  
  const baseStyles = {
    h1: "text-5xl md:text-8xl font-light tracking-tight leading-[0.9]",
    h2: "text-3xl md:text-5xl font-bold mb-4",
    h3: "text-3xl font-medium mb-8 leading-tight",
  }[level];

  const colorStyles = dark ? "text-black" : "text-white";

  return (
    <Tag 
      className={`${baseStyles} ${colorStyles} ${className}`}
      style={{ fontFamily: "var(--font-alexandria), sans-serif" }}
    >
      {mainText} 
      {italicText && (
        <>
          <br />
          <span className="italic font-serif">{italicText}</span>
        </>
      )}
    </Tag>
  );
}
