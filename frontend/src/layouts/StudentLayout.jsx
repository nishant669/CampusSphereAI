import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  HomeIcon, ClipboardDocumentCheckIcon, AcademicCapIcon, 
  BookOpenIcon, UserIcon, KeyIcon, ArrowRightOnRectangleIcon, 
  Bars3Icon, XMarkIcon 
} from '@heroicons/react/24/outline'

export default function StudentLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: HomeIcon },
    { name: 'Attendance', path: '/student/attendance', icon: ClipboardDocumentCheckIcon },
    { name: 'Marks', path: '/student/marks', icon: AcademicCapIcon },
    { name: 'Study Materials', path: '/student/materials', icon: BookOpenIcon },
    { name: 'Profile', path: '/student/profile', icon: UserIcon },
    { name: 'CampusSphere AI', path: '/student/campus-hub', icon: BookOpenIcon },
    { name: 'Change Password', path: '/student/change-password', icon: KeyIcon },
  ]

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/80 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3 text-white mb-8">
              <AcademicCapIcon className="w-8 h-8" />
              <span className="text-xl font-bold">CampusSphere AI</span>
              <button className="ml-auto md:hidden" onClick={() => setMobileMenuOpen(false)}>
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold mb-3 shadow-lg">
                {getInitials(user?.name)}
              </div>
              <h3 className="text-white font-medium text-center">{user?.name}</h3>
              <span className="badge bg-indigo-800 text-indigo-100 mt-2">Student</span>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <div 
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6">
            <button onClick={logout} className="sidebar-link w-full text-red-300 hover:text-white hover:bg-red-500/20">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm h-16 flex items-center px-4 sm:px-6 lg:px-8 shrink-0">
          <button className="md:hidden mr-4 text-gray-500 hover:text-gray-900" onClick={() => setMobileMenuOpen(true)}>
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
            {navItems.find(i => i.path === location.pathname)?.name || 'Portal'}
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
