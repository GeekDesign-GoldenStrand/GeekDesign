interface PaginacionNumeradaProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginacionNumerada({ page, totalPages, onPageChange }: PaginacionNumeradaProps) {
  if (totalPages <= 1) return null;

  // Show first, last, and the pages around the current one; collapse the rest into "…".
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div className="flex justify-center lg:justify-end mt-8 gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className="w-[36px] h-[36px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#1e1e1e] disabled:text-[#d1d1d1] hover:bg-gray-50 transition-colors text-[15px]"
      >
        {"<"}
      </button>
      {getPageNumbers().map((p, idx) => (
        <button
          key={idx}
          onClick={() => typeof p === "number" && onPageChange(p)}
          disabled={p === "..." || p === page}
          aria-current={p === page ? "page" : undefined}
          className={`w-[36px] h-[36px] rounded-[4px] font-bold text-[15px] font-ibm-plex transition-colors ${
            p === page
              ? "bg-[#e42200] text-white"
              : p === "..."
                ? "text-[#d1d1d1] cursor-default"
                : "bg-[#f0f0f0] text-[#1e1e1e] hover:bg-gray-200"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Página siguiente"
        className="w-[36px] h-[36px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#1e1e1e] disabled:text-[#d1d1d1] hover:bg-gray-50 transition-colors text-[15px]"
      >
        {">"}
      </button>
    </div>
  );
}
