import React, { useState, useEffect } from 'react'
import { getAdminDashboard } from '../../services/dashboardService'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatCard from '../../components/StatCard'
import toast from 'react-hot-toast'
import { UsersIcon, BookOpenIcon, ClipboardDocumentCheckIcon, FolderIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getAdminDashboard()
        setData(res.data.data)   // backend: { success, message, data: { totalStudents, ... } }
      } catch (err) {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return <div className="card text-gray-500 text-center py-10">No dashboard data available</div>

  const avgPct = data.averageAttendance || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview of the academic portal</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Students" value={data.totalStudents || 0} icon={UsersIcon} color="indigo"
          subtitle="Active students" />
        <StatCard title="Total Subjects" value={data.totalSubjects || 0} icon={BookOpenIcon} color="green"
          subtitle="Active subjects" />
        <StatCard title="Today's Marked" value={data.todayAttendanceCount || 0} icon={ClipboardDocumentCheckIcon} color="blue"
          subtitle="Students marked today" />
        <StatCard title="Study Materials" value={data.totalMaterials || 0} icon={FolderIcon} color="orange"
          subtitle="Total uploads" />
        <StatCard title="Avg Attendance" value={`${avgPct.toFixed(1)}%`} icon={ChartBarIcon}
          color={avgPct >= 75 ? 'green' : avgPct >= 60 ? 'orange' : 'red'}
          subtitle="Overall average" />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => navigate('/admin/students')} className="btn-secondary py-3 text-sm">
            👤 Manage Students
          </button>
          <button onClick={() => navigate('/admin/subjects')} className="btn-secondary py-3 text-sm">
            📚 Manage Subjects
          </button>
          <button onClick={() => navigate('/admin/attendance')} className="btn-secondary py-3 text-sm">
            📋 Mark Attendance
          </button>
          <button onClick={() => navigate('/admin/materials')} className="btn-secondary py-3 text-sm">
            📁 Upload Materials
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students Below 75% */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-semibold text-red-600">Students Below 75% Attendance</h3>
            {data.studentsBelow75Count > 0 && (
              <span className="badge badge-red">{data.studentsBelow75Count}</span>
            )}
          </div>
          {data.studentsBelow75Count > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header text-left">Enrollment</th>
                    <th className="table-header text-left">Name</th>
                    <th className="table-header text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Note: below75 list is a count only from admin dashboard; link to attendance page */}
                  <tr>
                    <td colSpan={3} className="table-cell text-center text-gray-500 py-6">
                      <button onClick={() => navigate('/admin/attendance')} className="text-indigo-600 hover:underline">
                        View attendance page for detailed list →
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg font-medium text-sm">
              ✅ All students have attendance above 75%!
            </div>
          )}
        </div>

        {/* Recent Materials */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Recent Uploads</h3>
          {data.recentMaterials?.length > 0 ? (
            <div className="space-y-3">
              {data.recentMaterials.map(m => (
                <div key={m._id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <span className="text-lg">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                    <p className="text-xs text-gray-500">{m.subject?.subjectName || '—'}</p>
                    <span className="text-xs text-indigo-600">{m.materialType?.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('/admin/materials')} className="text-indigo-600 hover:underline text-xs w-full text-center pt-1">
                View all materials →
              </button>
            </div>
          ) : (
            <div className="text-gray-400 text-sm text-center py-6">
              No materials uploaded yet
              <div className="mt-2">
                <button onClick={() => navigate('/admin/materials')} className="text-indigo-600 hover:underline text-xs">
                  Upload your first material
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
