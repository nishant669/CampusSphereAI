import React from 'react'

export default function EmptyState({ title, description, actionLabel, onAction, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon ? <Icon className="w-16 h-16 text-gray-300 mb-4" /> : <span className="text-5xl mb-4">📭</span>}
      <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-4 btn-primary">{actionLabel}</button>
      )}
    </div>
  )
}
