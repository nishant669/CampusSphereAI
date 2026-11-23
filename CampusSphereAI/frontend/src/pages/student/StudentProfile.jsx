import React, { useState, useEffect } from 'react'
import { getMe } from '../../services/studentService'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { UserCircleIcon } from '@heroicons/react/24/outline'

export default function StudentProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMe()
        setProfile(res.data.data)
      } catch (err) {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  if (loading) return <LoadingSpinner />
  if (!profile) return (
    <div className="card text-center py-16 text-gray-500">
      <UserCircleIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <p>Profile not found</p>
    </div>
  )

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'

  const isActive = profile.status === 'ACTIVE'

  const InfoItem = ({ label, value }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-gray-800">{value || '—'}</p>
    </div>
  )

  const academicPerformance = profile.academicPerformance || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="card">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
            {getInitials(profile.fullName)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{profile.fullName}</h2>
            <p className="text-gray-500 mt-1 font-mono">{profile.enrollmentNumber}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`badge ${isActive ? 'badge-green' : 'badge-red'}`}>
                {isActive ? '✓ Active Student' : '✗ Inactive'}
              </span>
              {profile.branch && (
                <span className="badge badge-blue">{profile.branch} — Sem {profile.semester}</span>
              )}
              {profile.course && (
                <span className="badge badge-purple">{profile.course}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Info */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Academic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Course" value={profile.course} />
          <InfoItem label="Branch" value={profile.branch} />
          <InfoItem label="Semester" value={profile.semester ? `Semester ${profile.semester}` : null} />
          <InfoItem label="Section" value={profile.section} />
          <InfoItem label="Academic Year" value={profile.academicYear} />
          <InfoItem label="Enrollment Number" value={profile.enrollmentNumber} />
          <InfoItem label="Last Sem SGPA" value={profile.lastSemSGPA != null ? profile.lastSemSGPA.toFixed(2) : null} />
          <InfoItem label="CGPA" value={profile.cgpa != null ? profile.cgpa.toFixed(2) : null} />
          <InfoItem label="Account Status" value={isActive ? 'Active' : 'Inactive'} />
        </div>
      </div>

      {/* Contact Info */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Email Address" value={profile.email} />
          <InfoItem label="Phone Number" value={profile.phone} />
        </div>
      </div>

      {/* Academic Performance History */}
      {academicPerformance.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Academic Performance History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header text-left">Semester</th>
                  <th className="table-header">Academic Year</th>
                  <th className="table-header">SGPA</th>
                  <th className="table-header">CGPA</th>
                  <th className="table-header">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {academicPerformance.map((record, i) => {
                  const sgpa = record.sgpa ?? record.SGPA
                  const cgpa = record.cgpa ?? record.CGPA
                  const result = record.result || (sgpa >= 5 ? 'PASS' : 'FAIL')
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">Semester {record.semester}</td>
                      <td className="table-cell text-center">{record.academicYear || '—'}</td>
                      <td className="table-cell text-center font-semibold">
                        <span className={sgpa >= 7 ? 'text-green-600' : sgpa >= 5 ? 'text-yellow-600' : 'text-red-600'}>
                          {sgpa != null ? sgpa.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="table-cell text-center font-semibold">
                        {cgpa != null ? cgpa.toFixed(2) : '—'}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge ${result === 'PASS' ? 'badge-green' : 'badge-red'}`}>
                          {result}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
