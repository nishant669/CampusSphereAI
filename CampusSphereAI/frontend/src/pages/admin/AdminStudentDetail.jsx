import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getById } from '../../services/studentService';
import { getStudentAttendance } from '../../services/attendanceService';
import { getStudentMarks as getMarks } from '../../services/marksService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { ArrowLeftIcon, AcademicCapIcon, ChartBarIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary'); // 'summary' | 'marks' | 'performance'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stuRes, attRes, marRes] = await Promise.all([
          getById(id),
          getStudentAttendance(id),
          getMarks(id)
        ]);
        setStudent(stuRes.data.data);
        setAttendance(attRes.data.data);
        setMarks(marRes.data.data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading complete academic file..." />;
  if (!student) return <EmptyState title="Student not found" />;

  const getPercentageColor = (pct) => {
    if (pct >= 75) return 'text-emerald-600 font-bold';
    if (pct >= 50) return 'text-amber-600 font-bold';
    return 'text-rose-600 font-bold';
  };

  const academicRecords = student.academicPerformance || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/students')}
        className="flex items-center text-gray-500 hover:text-indigo-600 font-bold text-sm"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back to All Students
      </button>

      {/* Header Profile Card */}
      <div className="card flex flex-col md:flex-row gap-6 items-start">
        <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-200 shrink-0">
          {student.fullName?.substring(0, 2).toUpperCase() || 'ST'}
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Enrollment No.</p>
            <p className="text-sm font-mono font-bold text-indigo-700">{student.enrollmentNumber}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Full Name</p>
            <p className="text-sm font-bold text-gray-900">{student.fullName}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Course & Branch</p>
            <p className="text-sm font-semibold text-gray-800">
              {student.course || 'B.Tech'} · {student.branch}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Sem & Section</p>
            <p className="text-sm font-semibold text-gray-800">
              Sem {student.semester} (Sec {student.section || 'A'})
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Last Sem SGPA</p>
            <p className="text-sm font-bold text-emerald-700">
              {student.lastSemSGPA ? Number(student.lastSemSGPA).toFixed(2) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Overall CGPA</p>
            <p className="text-sm font-bold text-purple-700">
              {student.cgpa ? Number(student.cgpa).toFixed(2) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('summary')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            tab === 'summary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Attendance Summary
        </button>
        <button
          onClick={() => setTab('marks')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            tab === 'marks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Exam Marks (MST & UT)
        </button>
        <button
          onClick={() => setTab('performance')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            tab === 'performance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🎓 Academic Performance History
        </button>
      </div>

      {/* Tab: Attendance Summary */}
      {tab === 'summary' && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4 text-base">Subject-wise Attendance Record</h3>
          {attendance && attendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header text-left">Subject</th>
                    <th className="table-header text-left">Code</th>
                    <th className="table-header text-center">Classes Held</th>
                    <th className="table-header text-center">Attended</th>
                    <th className="table-header text-center">Absent</th>
                    <th className="table-header text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="table-cell font-semibold text-gray-900">{item.subject?.subjectName || '—'}</td>
                      <td className="table-cell font-mono text-gray-600">{item.subject?.subjectCode || '—'}</td>
                      <td className="table-cell text-center font-bold text-gray-800">{item.total}</td>
                      <td className="table-cell text-center font-bold text-emerald-600">{item.present}</td>
                      <td className="table-cell text-center font-bold text-rose-600">{item.absent}</td>
                      <td className={`table-cell text-center ${getPercentageColor(item.percentage)}`}>
                        {item.percentage !== undefined ? `${item.percentage.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No Attendance Records" description="No attendance sessions have been marked for this student." />
          )}
        </div>
      )}

      {/* Tab: Exam Marks */}
      {tab === 'marks' && (
        <div className="space-y-4">
          {marks && marks.length > 0 ? (
            marks.map((sub, idx) => (
              <div key={idx} className="card">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{sub.subjectName}</h4>
                    <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {sub.subjectCode}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="table-header text-left">Exam / Test</th>
                        <th className="table-header text-center">Obtained Marks</th>
                        <th className="table-header text-center">Maximum Marks</th>
                        <th className="table-header text-center">Percentage</th>
                        <th className="table-header text-left">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sub.marks?.map((m, mIdx) => (
                        <tr key={mIdx} className="hover:bg-gray-50">
                          <td className="table-cell font-semibold text-gray-800">{m.examType?.replace('_', ' ')}</td>
                          <td className="table-cell text-center font-bold text-gray-900">{m.obtainedMarks}</td>
                          <td className="table-cell text-center text-gray-500">{m.maximumMarks}</td>
                          <td className={`table-cell text-center ${getPercentageColor(m.percentage)}`}>
                            {m.percentage?.toFixed(1)}%
                          </td>
                          <td className="table-cell text-gray-500 text-xs">{m.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No Marks Recorded" description="No MST or Unit Test marks have been entered for this student yet." />
          )}
        </div>
      )}

      {/* Tab: Academic Performance History */}
      {tab === 'performance' && (
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Semester-Wise Performance History</h3>
              <p className="text-xs text-gray-500">Track of student's SGPA, CGPA, earned credits, and backlogs</p>
            </div>
            <div className="flex gap-4 text-xs font-bold">
              <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
                Current SGPA: {student.lastSemSGPA ? Number(student.lastSemSGPA).toFixed(2) : '—'}
              </span>
              <span className="bg-purple-50 text-purple-800 px-3 py-1 rounded-lg border border-purple-200">
                Cumulative CGPA: {student.cgpa ? Number(student.cgpa).toFixed(2) : '—'}
              </span>
            </div>
          </div>

          {academicRecords.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header text-center">Semester</th>
                    <th className="table-header text-center">SGPA</th>
                    <th className="table-header text-center">CGPA</th>
                    <th className="table-header text-center">Credits Earned</th>
                    <th className="table-header text-center">Backlogs</th>
                    <th className="table-header text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {academicRecords.map((rec, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="table-cell text-center font-bold text-gray-800">Semester {rec.semester}</td>
                      <td className="table-cell text-center font-bold text-emerald-700">{rec.sgpa?.toFixed(2)}</td>
                      <td className="table-cell text-center font-bold text-purple-700">{rec.cgpa?.toFixed(2)}</td>
                      <td className="table-cell text-center text-gray-600">{rec.totalCredits || '—'}</td>
                      <td className="table-cell text-center">
                        <span className={`badge ${rec.backlogs > 0 ? 'badge-red' : 'badge-green'}`}>
                          {rec.backlogs || 0}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-gray-500">{rec.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl">
              <p>No detailed semester history logged yet.</p>
              <p className="text-xs mt-1">Current performance: SGPA {student.lastSemSGPA || 'N/A'}, CGPA {student.cgpa || 'N/A'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
