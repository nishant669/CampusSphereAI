import React from 'react'

export default function AttendanceWarningBanner({ percentage }) {
  if (!percentage || percentage >= 75) return null
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 mb-4">
      <span className="text-2xl">⚠️</span>
      <div>
        <p className="font-semibold text-orange-800">Low Attendance Alert</p>
        <p className="text-orange-700 text-sm">Your overall attendance is <strong>{percentage?.toFixed(1)}%</strong>. Minimum required attendance is 75%. Please attend classes regularly.</p>
      </div>
    </div>
  )
}
