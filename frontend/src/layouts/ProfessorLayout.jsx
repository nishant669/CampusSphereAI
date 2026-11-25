import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard',          path: '/professor/dashboard',   icon: HomeIcon },
  { name: 'My Students',        path: '/professor/students',    icon: UsersIcon },
  { name: 'Mark Attendance',    path: '/professor/attendance',  icon: ClipboardDocumentCheckIcon },
  { name: 'Marks & Submissions',path: '/professor/marks',       icon: AcademicCapIcon },
  { name: 'Study Materials',    path: '/professor/materials',   icon: BookOpenIcon },
  { name: 'My Profile',         path: '/professor/profile',     icon: UserIcon },
  { name: 'CampusSphere AI',     path: '/professor/campus-hub', icon: BookOpenIcon },
  { name: 'Change Password',    path: '/professor/change-password', icon: KeyIcon },
];

export default function ProfessorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'PR';
  };

  const currentPageTitle = navItems.find(item => location.pathname === item.path)?.name || 'CampusSphere AI';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/50">
              FP
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">CampusSphere AI</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-400 border border-emerald-700/50">
                Professor
              </span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Professor Profile Snippet */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
              {getInitials(user?.name)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-emerald-400 font-mono truncate">
                {user?.employeeId ? `ID: ${user.employeeId}` : user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">{currentPageTitle}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400 font-mono">{user?.employeeId || user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
