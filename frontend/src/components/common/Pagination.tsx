"use client";

import React from "react";

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) {
    return null;
  }

  const safePage = Math.max(1, Math.min(page, pages));

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onPageChange(safePage - 1)}
        disabled={safePage <= 1}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-200"
      >
        Previous
      </button>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Page {safePage} of {pages}
      </p>
      <button
        type="button"
        onClick={() => onPageChange(safePage + 1)}
        disabled={safePage >= pages}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-200"
      >
        Next
      </button>
    </div>
  );
}
