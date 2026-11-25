import React, { useState, useEffect } from 'react';
import { getSession, saveBulk, getAll, update } from '../../services/attendanceService';
import { getAll as getSubjects } from '../../services/subjectService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminAttendance() {
  const [tab, setTab] = useState('mark');
  const [subjects, setSubjects] = useState([]);

  // Mark tab
  const [markForm, setMarkForm] = useState({ date: new Date().toISOString().split('T')[0], subjectId: '' });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // View tab
  const [docs, setDocs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [viewFilters, setViewFilters] = useState({ subjectId: '', date: '', status: '' });
  const [loadingView, setLoadingView] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (tab === 'view') fetchViewData(1);
  }, [tab, viewFilters.subjectId, viewFilters.date, viewFilters.status]);

  const fetchSubjects = async () => {
    try {
      const res = await getSubjects({ limit: 100 });
      const subs = res.data.data?.docs || res.data.data || [];
      setSubjects(subs);
      if (subs.length > 0) {
        setMarkForm(prev => ({ ...prev, subjectId: subs[0]._id }));
      }
    } catch {}
  };

  const handleLoadStudents = async () => {
    if (!markForm.subjectId || !markForm.date) return toast.error('Select both date and subject');
    setLoadingStudents(true);
    try {
      const res = await getSession({ subjectId: markForm.subjectId, date: markForm.date });
      const records = res.data.data || [];
      setStudents(records.map(r => ({ ...r, status: r.status || 'NOT_MARKED' })));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load students for session');
    } finally {
      setLoadingStudents(false);
    }
  };

  const setStudentStatus = (studentId, status) => {
    setStudents(prev =>
      prev.map(s => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSaveBulk = async () => {
    if (!students.length) return toast.error('No students loaded');
    setSaving(true);
    try {
      await saveBulk({
        subjectId: markForm.subjectId,
        date: markForm.date,
        records: students
      });
      toast.success('Attendance saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const fetchViewData = async (page = 1) => {
    setLoadingView(true);
    try {
      const res = await getAll({ page, limit: 15, ...viewFilters });
      const d = res.data.data;
      setDocs(d?.docs || []);
      setPagination({ page: d?.page || 1, totalPages: d?.totalPages || 1 });
    } catch {
      toast.error('Failed to load attendance records');
    } finally {
      setLoadingView(false);
    }
  };

  const toggleStatusInline = async (record) => {
    const newStatus = record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    try {
      await update(record._id, { status: newStatus });
      toast.success('Status updated');
      setDocs(prev => prev.map(d => (d._id === record._id ? { ...d, status: newStatus } : d)));
    } catch {
      toast.error('Update failed');
    }
  };

  const presentCount = students.filter(s => s.status === 'PRESENT').length;
  const absentCount = students.filter(s => s.status === 'ABSENT').length;
  const notMarkedCount = students.filter(s => s.status === 'NOT_MARKED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Student Attendance</h1>
        <p className="text-sm text-gray-500">
          Director / HOD can mark or inspect attendance across all subjects and batches. Options: Present, Absent, Do Not Mark.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            tab === 'mark' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('mark')}
        >
          📋 Mark Session Attendance
        </button>
        <button
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            tab === 'view' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('view')}
        >
          📊 View All Records
        </button>
      </div>

      {/* TAB 1: MARK ATTENDANCE */}
      {tab === 'mark' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Session Date</label>
              <input
                type="date"
                className="input-field"
                value={markForm.date}
                onChange={e => setMarkForm({ ...markForm, date: e.target.value })}
              />
            </div>

            <div className="min-w-[280px] flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Subject</label>
              <select
                className="input-field"
                value={markForm.subjectId}
                onChange={e => setMarkForm({ ...markForm, subjectId: e.target.value })}
              >
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.subjectName} ({s.subjectCode}) — Sem {s.semester} {s.branch}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLoadStudents}
              disabled={loadingStudents || !markForm.subjectId}
              className="btn-primary py-2.5 px-6 font-bold"
            >
              {loadingStudents ? 'Loading Students...' : 'Load Students'}
            </button>
          </div>

          {loadingStudents ? (
            <LoadingSpinner message="Fetching students..." />
          ) : students.length > 0 ? (
            <div className="card space-y-4">
              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ Present: {presentCount}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
                    ✗ Absent: {absentCount}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700">
                    ○ Do Not Mark: {notMarkedCount}
                  </span>
                  <span className="text-gray-500 font-normal">Total in Class: {students.length}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => markAll('PRESENT')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => markAll('ABSENT')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    All Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => markAll('NOT_MARKED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-700"
                  >
                    Do Not Mark All
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Enrollment</th>
                      <th className="table-header text-left">Student Name</th>
                      <th className="table-header text-center">Attendance Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(st => {
                      const isPresent = st.status === 'PRESENT';
                      const isAbsent = st.status === 'ABSENT';
                      const isNotMarked = st.status === 'NOT_MARKED';

                      return (
                        <tr
                          key={st.studentId}
                          className={`transition-colors ${
                            isPresent ? 'bg-emerald-50/40' : isAbsent ? 'bg-rose-50/40' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="table-cell font-mono font-bold text-purple-700">{st.enrollmentNumber}</td>
                          <td className="table-cell font-semibold text-gray-900">{st.fullName}</td>
                          <td className="table-cell">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setStudentStatus(st.studentId, 'PRESENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-100'
                                }`}
                              >
                                ✓ Present
                              </button>
                              <button
                                type="button"
                                onClick={() => setStudentStatus(st.studentId, 'ABSENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isAbsent
                                    ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-rose-100'
                                }`}
                              >
                                ✗ Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => setStudentStatus(st.studentId, 'NOT_MARKED')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isNotMarked
                                    ? 'bg-slate-700 text-white font-bold'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                ○ Do Not Mark
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveBulk}
                  disabled={saving}
                  className="btn-primary py-3 px-8 text-base font-bold shadow-lg"
                >
                  {saving ? 'Saving...' : 'Save Session Attendance'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Class Session Loaded"
              description="Select date and subject above, then click 'Load Students' to mark attendance."
            />
          )}
        </div>
      )}

      {/* TAB 2: VIEW RECORDS */}
      {tab === 'view' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-4 items-center">
            <input
              type="date"
              className="input-field w-auto"
              value={viewFilters.date}
              onChange={e => setViewFilters({ ...viewFilters, date: e.target.value })}
            />

            <select
              className="input-field w-auto min-w-[200px]"
              value={viewFilters.subjectId}
              onChange={e => setViewFilters({ ...viewFilters, subjectId: e.target.value })}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>
                  {s.subjectName} ({s.subjectCode})
                </option>
              ))}
            </select>

            <select
              className="input-field w-auto min-w-[150px]"
              value={viewFilters.status}
              onChange={e => setViewFilters({ ...viewFilters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          {loadingView ? (
            <LoadingSpinner message="Loading records..." />
          ) : docs.length > 0 ? (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Date</th>
                      <th className="table-header text-left">Enrollment</th>
                      <th className="table-header text-left">Student Name</th>
                      <th className="table-header text-left">Subject</th>
                      <th className="table-header text-center">Status</th>
                      <th className="table-header text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {docs.map(record => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="table-cell font-mono text-gray-600">
                          {record.date ? format(new Date(record.date), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="table-cell font-mono font-bold text-gray-800">
                          {record.student?.enrollmentNumber || '—'}
                        </td>
                        <td className="table-cell font-semibold text-gray-900">{record.student?.fullName || '—'}</td>
                        <td className="table-cell">{record.subject?.subjectName || '—'}</td>
                        <td className="table-cell text-center">
                          <span
                            className={`badge ${
                              record.status === 'PRESENT'
                                ? 'badge-green'
                                : record.status === 'ABSENT'
                                ? 'badge-red'
                                : 'badge-gray'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="table-cell text-center">
                          <button
                            onClick={() => toggleStatusInline(record)}
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={fetchViewData}
                />
              </div>
            </div>
          ) : (
            <EmptyState title="No Attendance Records" description="No attendance records match your filter criteria." />
          )}
        </div>
      )}
    </div>
  );
}
