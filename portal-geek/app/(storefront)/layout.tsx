import { Navbar } from "@/components/storefront/organisms/Navbar";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f9]">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
