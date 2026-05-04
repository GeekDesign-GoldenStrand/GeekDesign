"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  const getPages = () => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("...");

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex items-center gap-2 mt-6">
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-[52px] h-[52px] flex items-center justify-center rounded-md border border-gray-500 bg-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <CaretLeftIcon size={32} weight="light" />
      </button>

      {/* Page numbers */}
      {getPages().map((page, i) =>
        page === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-[52px] h-[52px] flex items-center justify-center text-gray-400 text-lg"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`w-[52px] h-[52px] flex items-center justify-center rounded-md font-['IBM_Plex_Sans_JP',sans-serif] text-[20px] font-regular transition-colors
              ${
                currentPage === page
                  ? "bg-[#e42200] text-white"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-[52px] h-[52px] flex items-center justify-center rounded-md border border-gray-500 bg-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <CaretRightIcon size={32} weight="light" />
      </button>
    </div>
  );
}
