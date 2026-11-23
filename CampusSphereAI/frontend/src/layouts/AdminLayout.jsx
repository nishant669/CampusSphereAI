import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, UsersIcon, BookOpenIcon, ClipboardDocumentCheckIcon,
  AcademicCapIcon, FolderIcon, UserIcon, KeyIcon, ArrowRightOnRectangleIcon, 
  Bars3Icon, XMarkIcon, DocumentTextIcon, ShieldCheckIcon, UserGroupIcon
} from '@heroicons/react/24/outline';

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard',          path: '/admin/dashboard',    icon: HomeIcon },
    { name: 'Professors',         path: '/admin/professors',   icon: UserGroupIcon },
    { name: 'Students',           path: '/admin/students',     icon: UsersIcon },
    { name: 'Student Analytics',  path: '/admin/analytics',    icon: DocumentTextIcon },
    { name: 'Bulk Promote',       path: '/admin/bulk-promote', icon: AcademicCapIcon },
    { name: 'Subjects',           path: '/admin/subjects',     icon: BookOpenIcon },
    { name: 'Attendance',         path: '/admin/attendance',   icon: ClipboardDocumentCheckIcon },
    { name: 'Marks & Submissions',path: '/admin/marks',        icon: FolderIcon },
    { name: 'Study Materials',    path: '/admin/materials',    icon: FolderIcon },
    { name: 'Profile',            path: '/admin/profile',      icon: UserIcon },
    { name: 'CampusSphere AI',     path: '/admin/campus-hub', icon: BookOpenIcon },
    { name: 'Change Password',    path: '/admin/change-password', icon: KeyIcon },
  ];

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/80 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-900/50">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight text-white">Director / HOD</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                  Full Authority
                </span>
              </div>
            </div>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
            
          {/* User profile capsule */}
          <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
              {getInitials(user?.name)}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-white font-semibold text-xs truncate">{user?.name}</h3>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-slate-800">
            <button 
              onClick={logout} 
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-500 hover:text-gray-700">
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {navItems.find(item => location.pathname === item.path)?.name || 'Admin Management'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="badge badge-purple text-xs font-bold hidden sm:inline-block">Director / HOD Portal</span>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
