import React, { useState, useEffect } from 'react'
import { getMyMarks, getMySubmissions } from '../../services/marksService'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import toast from 'react-hot-toast'

const examLabel = {
  MST_1: 'MST 1', MST_2: 'MST 2', MST_3: 'MST 3',
  UNIT_TEST_1: 'Unit Test 1', UNIT_TEST_2: 'Unit Test 2', UNIT_TEST_3: 'Unit Test 3'
}

export default function StudentMarks() {
  const [subjectGroups, setSubjectGroups] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('marks')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [marksRes, subRes] = await Promise.allSettled([
          getMyMarks(),
          getMySubmissions()
        ])
        if (marksRes.status === 'fulfilled') {
          setSubjectGroups(marksRes.value.data.data || [])
        } else {
          toast.error('Failed to load marks')
        }
        if (subRes.status === 'fulfilled') {
          setSubmissions(subRes.value.data.data || [])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return <LoadingSpinner />

  const statusBadge = (val) => {
    if (val === true) return <span className="badge badge-green">✓ Submitted</span>
    if (val === false) return <span className="badge badge-red">✗ Not Submitted</span>
    return <span className="badge badge-gray">—</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Marks & Submissions</h1>
        <p className="text-gray-500 text-sm">Subject-wise exam performance and submission status</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'marks', label: 'Exam Marks' },
          { key: 'submissions', label: 'Assignments & Practicals' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Marks Tab */}
      {tab === 'marks' && (
        <>
          {subjectGroups.length === 0 ? (
            <EmptyState title="No marks published yet" description="Your marks will appear here once entered by the admin." />
          ) : (
            subjectGroups.map((group) => {
              const allMarks = group.marks || []
              const avgPct = allMarks.length > 0
                ? allMarks.reduce((sum, m) => sum + (m.percentage || 0), 0) / allMarks.length
                : 0

              return (
                <div key={group.subjectId} className="card">
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{group.subjectName}</h3>
                      <span className="text-sm text-gray-500 font-mono">{group.subjectCode}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Average</p>
                      <p className={`text-lg font-bold ${avgPct >= 75 ? 'text-green-600' : avgPct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {avgPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="table-header text-left">Exam Type</th>
                          <th className="table-header text-center">Obtained</th>
                          <th className="table-header text-center">Maximum</th>
                          <th className="table-header text-center">Percentage</th>
                          {allMarks.some(m => m.remarks) && <th className="table-header text-left">Remarks</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allMarks.map((m, i) => {
                          const pct = m.percentage || (m.maximumMarks > 0 ? (m.obtainedMarks / m.maximumMarks) * 100 : 0)
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="table-cell font-medium">{examLabel[m.examType] || m.examType?.replace(/_/g, ' ')}</td>
                              <td className="table-cell text-center font-bold text-gray-900">{m.obtainedMarks}</td>
                              <td className="table-cell text-center text-gray-500">{m.maximumMarks}</td>
                              <td className="table-cell text-center">
                                <span className={`font-semibold ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {pct.toFixed(1)}%
                                </span>
                              </td>
                              {allMarks.some(m => m.remarks) && (
                                <td className="table-cell text-gray-500 text-sm">{m.remarks || '—'}</td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </>
      )}

      {/* Submissions Tab */}
      {tab === 'submissions' && (
        <>
          {submissions.length === 0 ? (
            <EmptyState
              title="No submission records yet"
              description="Assignment and practical submission status will appear here."
            />
          ) : (
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header text-left">Subject</th>
                    <th className="table-header text-center">Assignment Submitted</th>
                    <th className="table-header text-center">Practical Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">
                        <div>{s.subject?.subjectName || '—'}</div>
                        <div className="text-xs text-gray-400 font-mono">{s.subject?.subjectCode}</div>
                      </td>
                      <td className="table-cell text-center">{statusBadge(s.assignmentSubmitted)}</td>
                      <td className="table-cell text-center">{statusBadge(s.practicalSubmitted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
