import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ChangePassword from './pages/ChangePassword'

import StudentLayout from './layouts/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentAttendance from './pages/student/StudentAttendance'
import StudentMarks from './pages/student/StudentMarks'
import StudentMaterials from './pages/student/StudentMaterials'
import StudentProfile from './pages/student/StudentProfile'

import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminStudentDetail from './pages/admin/AdminStudentDetail'
import AdminStudentAnalytics from './pages/admin/AdminStudentAnalytics'
import AdminBulkPromote from './pages/admin/AdminBulkPromote'
import AdminSubjects from './pages/admin/AdminSubjects'
import AdminAttendance from './pages/admin/AdminAttendance'
import AdminMarks from './pages/admin/AdminMarks'
import AdminMaterials from './pages/admin/AdminMaterials'
import AdminProfile from './pages/admin/AdminProfile'
import AdminProfessors from './pages/admin/AdminProfessors'

import ProfessorLayout from './layouts/ProfessorLayout'
import ProfessorDashboard from './pages/professor/ProfessorDashboard'
import ProfessorStudents from './pages/professor/ProfessorStudents'
import ProfessorAttendance from './pages/professor/ProfessorAttendance'
import ProfessorMarks from './pages/professor/ProfessorMarks'
import ProfessorMaterials from './pages/professor/ProfessorMaterials'
import ProfessorProfile from './pages/professor/ProfessorProfile'
import CampusHub from './pages/CampusHub'

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute role="STUDENT" />}>
          <Route element={<StudentLayout />}>
            <Route path="dashboard"       element={<StudentDashboard />} />
            <Route path="attendance"      element={<StudentAttendance />} />
            <Route path="marks"           element={<StudentMarks />} />
            <Route path="materials"       element={<StudentMaterials />} />
            <Route path="profile"         element={<StudentProfile />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="campus-hub" element={<CampusHub />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard"       element={<AdminDashboard />} />
            <Route path="students"        element={<AdminStudents />} />
            <Route path="students/:id"    element={<AdminStudentDetail />} />
            <Route path="analytics"       element={<AdminStudentAnalytics />} />
            <Route path="bulk-promote"    element={<AdminBulkPromote />} />
            <Route path="professors"      element={<AdminProfessors />} />
            <Route path="subjects"        element={<AdminSubjects />} />
            <Route path="attendance"      element={<AdminAttendance />} />
            <Route path="marks"           element={<AdminMarks />} />
            <Route path="materials"       element={<AdminMaterials />} />
            <Route path="profile"         element={<AdminProfile />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="campus-hub" element={<CampusHub />} />
          </Route>
        </Route>

        {/* Professor Routes */}
        <Route path="/professor" element={<ProtectedRoute role="PROFESSOR" />}>
          <Route element={<ProfessorLayout />}>
            <Route path="dashboard"       element={<ProfessorDashboard />} />
            <Route path="students"        element={<ProfessorStudents />} />
            <Route path="attendance"      element={<ProfessorAttendance />} />
            <Route path="marks"           element={<ProfessorMarks />} />
            <Route path="materials"       element={<ProfessorMaterials />} />
            <Route path="profile"         element={<ProfessorProfile />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="campus-hub" element={<CampusHub />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
