import React from 'react'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const getPages = () => {
    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, start + 4)
    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }
    const pages = []
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Previous
      </button>
      {getPages().map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded flex items-center justify-center ${p === currentPage ? 'bg-indigo-600 text-white' : 'border hover:bg-gray-50'}`}
        >
          {p}
        </button>
      ))}
      <button 
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}
