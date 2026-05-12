import { FolioSearchBar } from "@/components/storefront/molecules/FolioSearchBar";

export default function ConsultarFolioPage() {
  return (
    <main className="min-h-[calc(100vh-200px)] bg-[#fcfcfc] py-12 px-4">
      <div className="max-w-[1240px] mx-auto">
        <FolioSearchBar />

        <div className="w-full border-t border-[#e8e8e8] pt-12 mt-16">
          <div className="flex flex-col items-center justify-center py-20 text-[#8e908f]">
            <p className="text-[18px] font-medium italic">Esperando que ingreses un folio...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
