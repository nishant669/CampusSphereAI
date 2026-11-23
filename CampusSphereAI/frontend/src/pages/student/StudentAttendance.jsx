import React, { useState, useEffect } from 'react'
import { getMySummary, getMyDaily } from '../../services/attendanceService'
import { getAll as getSubjects } from '../../services/subjectService'
import LoadingSpinner from '../../components/LoadingSpinner'
import AttendanceWarningBanner from '../../components/AttendanceWarningBanner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function StudentAttendance() {
  const [tab, setTab] = useState('summary')
  const [summaryItems, setSummaryItems] = useState([])  // array from backend
  const [daily, setDaily] = useState({ docs: [], totalPages: 1, page: 1 })
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState({ date: '', subjectId: '', status: '' })

  useEffect(() => {
    fetchSummary()
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (tab === 'daily') fetchDaily(1)
  }, [tab])

  const fetchSummary = async () => {
    try {
      const res = await getMySummary()
      // Backend returns array: [{subject:{...}, total, present, absent, percentage}]
      setSummaryItems(res.data.data || [])
    } catch (err) {
      toast.error('Failed to load attendance summary')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await getSubjects({ limit: 100 })
      setSubjects(res.data.data?.docs || res.data.data || [])
    } catch (err) {}
  }

  const fetchDaily = async (page = 1) => {
    setLoading(true)
    try {
      const res = await getMyDaily({ page, limit: 10, ...filters })
      // Backend returns paginated object
      const d = res.data.data
      setDaily({
        docs: d?.docs || d || [],
        totalPages: d?.totalPages || 1,
        page: d?.page || page
      })
    } catch (err) {
      toast.error('Failed to load daily attendance')
    } finally {
      setLoading(false)
    }
  }

  // Calculate overall from summary items
  const totalClasses = summaryItems.reduce((a, s) => a + (s.total || 0), 0)
  const totalPresent = summaryItems.reduce((a, s) => a + (s.present || 0), 0)
  const overallPct = totalClasses > 0 ? (totalPresent / totalClasses * 100) : 0

  const pctColor = (pct) => {
    if (pct >= 75) return 'badge-green'
    if (pct >= 60) return 'badge-yellow'
    return 'badge-red'
  }

  if (loading && summaryItems.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-gray-500 text-sm">Track your attendance across all subjects</p>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 ${tab === 'summary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('summary')}
        >
          Summary
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 ${tab === 'daily' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('daily')}
        >
          Daily Attendance
        </button>
      </div>

      {tab === 'summary' && (
        <div className="space-y-6">
          <AttendanceWarningBanner percentage={overallPct} />

          <div className="card text-center py-8">
            <h3 className="text-gray-500 mb-4 text-sm font-medium uppercase tracking-wide">Overall Attendance</h3>
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-8 ${overallPct >= 75 ? 'border-green-500 text-green-600' : overallPct >= 60 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'} text-3xl font-bold`}>
              {overallPct.toFixed(1)}%
            </div>
            <p className="mt-4 text-gray-500 text-sm">
              {totalPresent} Present / {totalClasses} Total Classes
            </p>
          </div>

          {summaryItems.length === 0 ? (
            <EmptyState title="No attendance data yet" description="Attendance will appear here once your teacher marks it." />
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Subject</th>
                      <th className="table-header text-left">Code</th>
                      <th className="table-header text-center">Total</th>
                      <th className="table-header text-center">Present</th>
                      <th className="table-header text-center">Absent</th>
                      <th className="table-header text-center">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {summaryItems.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="table-cell font-medium">{item.subject?.subjectName || '—'}</td>
                        <td className="table-cell text-gray-500 font-mono">{item.subject?.subjectCode || '—'}</td>
                        <td className="table-cell text-center">{item.total}</td>
                        <td className="table-cell text-center text-green-600 font-medium">{item.present}</td>
                        <td className="table-cell text-center text-red-500 font-medium">{item.absent}</td>
                        <td className="table-cell text-center">
                          <span className={`badge ${pctColor(item.percentage)}`}>
                            {item.percentage?.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'daily' && (
        <div className="card space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" className="input-field py-1.5" value={filters.date}
                onChange={e => setFilters({ ...filters, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className="input-field py-1.5" value={filters.subjectId}
                onChange={e => setFilters({ ...filters, subjectId: e.target.value })}>
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field py-1.5" value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
            <button onClick={() => fetchDaily(1)} className="btn-primary py-1.5">Apply Filter</button>
          </div>

          {loading ? <LoadingSpinner /> : daily.docs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Date</th>
                      <th className="table-header text-left">Subject</th>
                      <th className="table-header text-left">Code</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {daily.docs.map(record => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="table-cell">{format(new Date(record.date), 'dd MMM yyyy')}</td>
                        <td className="table-cell font-medium">{record.subject?.subjectName || '—'}</td>
                        <td className="table-cell text-gray-500 font-mono">{record.subject?.subjectCode || '—'}</td>
                        <td className="table-cell text-center">
                          <span className={`badge ${record.status === 'PRESENT' ? 'badge-green' : 'badge-red'}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={daily.page} totalPages={daily.totalPages} onPageChange={fetchDaily} />
            </>
          ) : <EmptyState title="No records found" description="Try adjusting your filters" />}
        </div>
      )}
    </div>
  )
}
