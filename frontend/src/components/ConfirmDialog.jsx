import React, { useEffect } from 'react'

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', variant = 'danger' }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
