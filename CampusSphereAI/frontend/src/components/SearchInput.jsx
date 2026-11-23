import React, { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  const [localValue, setLocalValue] = useState(value || '')
  // Store onChange in a ref so it never triggers the debounce effect
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Debounce: only fires when localValue changes, not when onChange reference changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeRef.current(localValue)
    }, 400)
    return () => clearTimeout(timer)
  }, [localValue])  // ← only localValue, NOT onChange

  return (
    <div className="relative w-full max-w-sm">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      <input
        type="text"
        className="input-field pl-10 pr-10"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
      />
      {localValue && (
        <button
          type="button"
          onClick={() => {
            setLocalValue('')
            onChangeRef.current('')
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
