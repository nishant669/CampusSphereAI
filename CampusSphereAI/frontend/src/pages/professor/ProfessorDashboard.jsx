import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfessorDashboard } from '../../services/dashboardService';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';
import {
  BookOpenIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ArrowUpTrayIcon,
  AcademicCapIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProfessorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getProfessorDashboard();
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load faculty dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;
  if (!data) return <div className="p-8 text-center text-gray-500">Failed to load dashboard data</div>;

  const assignedSubjects = data.assignedSubjects || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="card bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 text-white p-6 rounded-2xl shadow-lg border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 bg-white/20 rounded-md">
              Faculty Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">Welcome, {data.profile?.fullName}!</h1>
            <p className="text-emerald-100 text-sm mt-1">
              {data.profile?.department} Department · Employee ID:{' '}
              <strong className="text-white font-mono">{data.profile?.employeeId}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate('/professor/attendance')}
              className="bg-white text-emerald-800 font-bold px-4 py-2 rounded-xl text-sm shadow hover:bg-emerald-50 transition-colors flex items-center gap-2"
            >
              <ClipboardDocumentCheckIcon className="w-4 h-4" />
              Mark Attendance
            </button>
            <button
              onClick={() => navigate('/professor/marks')}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-2 rounded-xl text-sm shadow transition-colors flex items-center gap-2"
            >
              <AcademicCapIcon className="w-4 h-4" />
              Update Marks
            </button>
            <button
              onClick={() => navigate('/professor/materials')}
              className="bg-slate-900/60 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-sm shadow transition-colors flex items-center gap-2"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              Upload Material
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Assigned Subjects"
          value={assignedSubjects.length}
          subtitle="Subjects currently teaching"
          icon={BookOpenIcon}
          color="green"
        />
        <StatCard
          title="Total Students Taught"
          value={data.totalStudentsTaught || 0}
          subtitle="Across your assigned batches"
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Study Materials Uploaded"
          value={data.totalMaterialsUploaded || 0}
          subtitle="Notes, papers, and assignments"
          icon={ArrowUpTrayIcon}
          color="purple"
        />
      </div>

      {/* Assigned Subjects Grid */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">My Assigned Teaching Subjects</h3>
            <p className="text-xs text-gray-500">You have authority to mark attendance, add marks, and upload materials for these subjects</p>
          </div>
          <span className="badge badge-green font-mono">{assignedSubjects.length} Active</span>
        </div>

        {assignedSubjects.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
            No subjects assigned to you yet. Please contact Director / HOD to assign subjects.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedSubjects.map((sub) => (
              <div
                key={sub._id}
                className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {sub.subjectCode}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">
                    Sem {sub.semester} · {sub.branch}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 mt-2 text-base">{sub.subjectName}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{sub.course || 'B.Tech'}</p>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => navigate('/professor/attendance')}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Attendance →
                  </button>
                  <button
                    onClick={() => navigate('/professor/marks')}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Marks & Submissions →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Study Materials Uploaded */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recently Uploaded Materials</h3>
            <p className="text-xs text-gray-500">Materials you have made available for your students</p>
          </div>
          <button
            onClick={() => navigate('/professor/materials')}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Manage All Materials →
          </button>
        </div>

        {(!data.recentMaterials || data.recentMaterials.length === 0) ? (
          <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl">
            You haven't uploaded any study materials yet. Click "Upload Material" to share papers or notes.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recentMaterials.map((mat) => (
              <div key={mat._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <DocumentArrowDownIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-800">{mat.title}</h5>
                    <p className="text-xs text-gray-400">
                      {mat.subject?.subjectName} ({mat.subject?.subjectCode}) · Type:{' '}
                      <span className="font-semibold text-gray-600">{mat.materialType}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(mat.uploadDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
