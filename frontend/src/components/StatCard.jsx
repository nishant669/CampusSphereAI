import React from 'react'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) {
  const colors = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`${colors[color]} p-3 rounded-xl text-white`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
