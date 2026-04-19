export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#fff8f9] font-alexandria px-6 py-10">
      {children}
    </main>
  );
}
