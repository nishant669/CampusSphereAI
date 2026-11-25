import React, { useState, useEffect } from 'react'
import { getStudentDashboard } from '../../services/dashboardService'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatCard from '../../components/StatCard'
import AttendanceWarningBanner from '../../components/AttendanceWarningBanner'
import EmptyState from '../../components/EmptyState'
import { ClipboardDocumentCheckIcon, BookOpenIcon, AcademicCapIcon, FolderIcon, ChartBarIcon, StarIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function StudentDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getStudentDashboard()
        setData(res.data.data)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return <EmptyState title="No data available" />

  const getAttendanceColor = (pct) => {
    if (!pct) return 'red'
    if (pct >= 75) return 'green'
    if (pct >= 60) return 'orange'
    return 'red'
  }

  const getPercentageColorClass = (pct) => {
    if (pct == null) return 'text-gray-500'
    if (pct >= 75) return 'text-green-600'
    if (pct >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const attendancePct = data?.attendance?.overallPercentage || 0
  const subjectWise = data?.attendance?.subjectWise || []
  const recentMarks = data?.recentMarks || []
  const recentMaterials = data?.recentMaterials || []
  const todayAttendance = data?.todayAttendance || []
  const profile = data?.profile || {}
  const sgpa = profile.lastSemSGPA
  const cgpa = profile.cgpa

  return (
    <div className="space-y-6">
      <AttendanceWarningBanner percentage={attendancePct} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="xl:col-span-2">
          <StatCard
            title="Overall Attendance"
            value={`${attendancePct.toFixed(1)}%`}
            icon={ClipboardDocumentCheckIcon}
            color={getAttendanceColor(attendancePct)}
            subtitle={attendancePct < 75 ? '⚠ Below 75%' : '✓ Good Standing'}
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Last Sem SGPA"
            value={sgpa != null ? sgpa.toFixed(2) : 'N/A'}
            icon={StarIcon}
            color="indigo"
            subtitle="Semester Grade Point Avg"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="CGPA"
            value={cgpa != null ? cgpa.toFixed(2) : 'N/A'}
            icon={ChartBarIcon}
            color="purple"
            subtitle="Cumulative Grade Point Avg"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Total Subjects"
            value={subjectWise.length}
            icon={BookOpenIcon}
            color="blue"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Recent Materials"
            value={recentMaterials.length}
            icon={FolderIcon}
            color="green"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Today's Attendance"
            value={todayAttendance.length > 0
              ? `${todayAttendance.filter(a => a.status === 'PRESENT').length}/${todayAttendance.length}`
              : 'N/A'}
            icon={AcademicCapIcon}
            color="orange"
            subtitle="Present / Total"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise Attendance */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Subject-wise Attendance</h3>
          {subjectWise.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header text-left">Subject</th>
                    <th className="table-header">Total</th>
                    <th className="table-header">Present</th>
                    <th className="table-header">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subjectWise.map((item, i) => (
                    <tr key={i}>
                      <td className="table-cell font-medium">{item.subject?.subjectName || 'Unknown'}</td>
                      <td className="table-cell text-center">{item.total}</td>
                      <td className="table-cell text-center text-green-600">{item.present}</td>
                      <td className={`table-cell text-center font-bold ${getPercentageColorClass(item.percentage)}`}>
                        {item.percentage?.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-500 text-sm">No attendance data yet</p>}
        </div>

        {/* Recent Marks */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Recent Marks</h3>
          {recentMarks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header text-left">Subject</th>
                    <th className="table-header">Exam</th>
                    <th className="table-header">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentMarks.map((item, i) => (
                    <tr key={i}>
                      <td className="table-cell font-medium">{item.subject?.subjectName || '—'}</td>
                      <td className="table-cell text-xs">{item.examType?.replace(/_/g, ' ')}</td>
                      <td className="table-cell font-semibold">
                        {item.obtainedMarks}/{item.maximumMarks}
                        <span className={`ml-1 text-xs ${getPercentageColorClass((item.obtainedMarks / item.maximumMarks) * 100)}`}>
                          ({((item.obtainedMarks / item.maximumMarks) * 100).toFixed(0)}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-500 text-sm">No marks recorded yet</p>}
        </div>
      </div>

      {/* Recent Materials */}
      {recentMaterials.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Recent Study Materials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentMaterials.map(m => (
              <div key={m._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.title}</p>
                  <p className="text-xs text-gray-500">{m.subject?.subjectName}</p>
                </div>
                <a href={`/api/materials/${m._id}/download`} target="_blank" rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-medium shrink-0">
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
