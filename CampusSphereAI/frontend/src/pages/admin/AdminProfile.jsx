import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function AdminProfile() {
  const { user } = useAuth()

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card flex items-center gap-6 p-8">
        <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg relative">
          {getInitials(user?.name)}
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
            <ShieldCheckIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{user?.name || 'Administrator'}</h2>
          <p className="text-lg text-gray-500 mt-1">{user?.email}</p>
          <span className="badge badge-purple mt-2">System Administrator</span>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-6 pb-2 border-b">Account Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
          <div>
            <p className="text-sm font-medium text-gray-500">Username / Email</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{user?.username || user?.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Role Level</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{user?.role || 'ADMIN'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
