import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, AcademicCapIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('STUDENT'); // 'STUDENT' | 'PROFESSOR' | 'ADMIN'
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setFormData({ username: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('Please enter your credentials');
      return;
    }

    setLoading(true);
    try {
      const res = await login({
        username: formData.username.trim(),
        password: formData.password,
        role: selectedRole
      });

      const responseData = res.data.data;
      const userData = {
        name: responseData.name,
        email: responseData.email,
        role: responseData.role,
        userId: responseData.userId,
        studentId: responseData.studentId || null,
        professorId: responseData.professorId || null,
        employeeId: responseData.employeeId || null,
        assignedSubjects: responseData.assignedSubjects || []
      };

      authLogin(responseData.token, userData);
      toast.success(`Welcome, ${responseData.name}!`);

      if (responseData.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (responseData.role === 'PROFESSOR') {
        navigate('/professor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials or account issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <AcademicCapIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-gray-900 tracking-tight">College Academic Portal</h2>
          <p className="mt-1 text-sm text-gray-500">Select your role to access your academic workspace</p>
        </div>

        {/* Role Selector: "Who are you?" */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Who are you? Select your role:
          </label>
          <div className="grid grid-cols-3 gap-2">
            
            {/* Student Card */}
            <button
              type="button"
              onClick={() => handleRoleChange('STUDENT')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                selectedRole === 'STUDENT'
                  ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-sm ring-2 ring-indigo-500'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AcademicCapIcon className="w-6 h-6 mb-1 text-indigo-600" />
              <span className="text-xs font-bold">Student</span>
            </button>

            {/* Professor Card */}
            <button
              type="button"
              onClick={() => handleRoleChange('PROFESSOR')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                selectedRole === 'PROFESSOR'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-800 shadow-sm ring-2 ring-emerald-500'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserGroupIcon className="w-6 h-6 mb-1 text-emerald-600" />
              <span className="text-xs font-bold">Professor</span>
            </button>

            {/* Admin (Director / HOD) Card */}
            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                selectedRole === 'ADMIN'
                  ? 'border-purple-600 bg-purple-50/80 text-purple-800 shadow-sm ring-2 ring-purple-500'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ShieldCheckIcon className="w-6 h-6 mb-1 text-purple-600" />
              <span className="text-xs font-bold">Director/HOD</span>
            </button>
          </div>
        </div>

        {/* Selected Role Badge */}
        <div className="bg-gray-50 rounded-lg p-2.5 text-center text-xs font-medium text-gray-600 border border-gray-100">
          Logging in as:{' '}
          <strong className="text-gray-900 font-bold">
            {selectedRole === 'STUDENT' && '🎓 Student'}
            {selectedRole === 'PROFESSOR' && '👨‍🏫 Professor / Faculty'}
            {selectedRole === 'ADMIN' && '👑 Director / HOD (Admin)'}
          </strong>
        </div>

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              {selectedRole === 'STUDENT' && 'Enrollment Number'}
              {selectedRole === 'PROFESSOR' && 'Email Address or Professor ID'}
              {selectedRole === 'ADMIN' && 'Admin Email Address'}
            </label>
            <input
              type="text"
              required
              className="mt-1 input-field"
              placeholder={
                selectedRole === 'STUDENT'
                  ? 'e.g. 2301234567'
                  : selectedRole === 'PROFESSOR'
                  ? 'e.g. prof.rajesh@college.edu or PROF101'
                  : 'e.g. admin@college.edu'
              }
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              {selectedRole === 'STUDENT' && (
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field pr-10"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl text-white font-bold transition-all shadow-md ${
              selectedRole === 'STUDENT'
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                : selectedRole === 'PROFESSOR'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
            } disabled:opacity-50`}
          >
            {loading ? 'Authenticating...' : `Login as ${selectedRole === 'ADMIN' ? 'Director/HOD' : selectedRole}`}
          </button>
        </form>

        {/* Demo Credentials Quick Hint */}
        <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500">Quick Demo Accounts:</p>
          <p>• <strong>Student:</strong> 2301234567 / Student@123</p>
          <p>• <strong>Professor:</strong> prof.rajesh@college.edu (or PROF101) / Prof@123</p>
          <p>• <strong>Admin (Director/HOD):</strong> admin@college.edu / Admin@123</p>
        </div>

      </div>
    </div>
  );
}
