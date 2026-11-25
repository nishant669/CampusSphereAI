import React, { useState, useEffect } from 'react';
import { getMe } from '../../services/professorService';
import { getSession, saveBulk, getSubjectStudents } from '../../services/attendanceService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const pctColor = (pct) => {
  if (pct == null) return 'text-gray-400';
  if (pct >= 75) return 'text-green-600';
  if (pct >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const pctBadge = (pct) => {
  if (pct == null) return 'badge badge-gray';
  if (pct >= 75) return 'badge badge-green';
  if (pct >= 60) return 'badge badge-yellow';
  return 'badge badge-red';
};

export default function ProfessorAttendance() {
  const [tab, setTab] = useState('mark'); // 'mark' | 'view'

  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mark Attendance state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Students Attendance View state
  const [viewSubjectId, setViewSubjectId] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [loadingView, setLoadingView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfessorProfile();
  }, []);

  const fetchProfessorProfile = async () => {
    try {
      const res = await getMe();
      const subjects = res.data.data?.assignedSubjects || [];
      setAssignedSubjects(subjects);
      if (subjects.length > 0) {
        setSelectedSubjectId(subjects[0]._id);
        setViewSubjectId(subjects[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load your assigned subjects');
    } finally {
      setLoading(false);
    }
  };

  // ─── Mark Attendance ────────────────────────────────────────────────────────
  const handleLoadStudents = async () => {
    if (!selectedSubjectId || !selectedDate) {
      toast.error('Please select both a subject and a date');
      return;
    }
    setLoadingStudents(true);
    try {
      const res = await getSession({ subjectId: selectedSubjectId, date: selectedDate });
      const records = res.data.data || [];
      setStudents(records.map(r => ({ ...r, status: r.status || 'NOT_MARKED' })));
      if (records.length === 0) toast('No active students found for this subject batch', { icon: 'ℹ️' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load students for this session');
    } finally {
      setLoadingStudents(false);
    }
  };

  const setStudentStatus = (studentId, status) => {
    setStudents(prev => prev.map(s => (s.studentId === studentId ? { ...s, status } : s)));
  };

  const handleMarkAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) { toast.error('No student records to save'); return; }
    setSaving(true);
    try {
      await saveBulk({ subjectId: selectedSubjectId, date: selectedDate, records: students });
      toast.success('Attendance recorded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // ─── View Students Attendance ───────────────────────────────────────────────
  const handleLoadStudentsAttendance = async () => {
    if (!viewSubjectId) { toast.error('Please select a subject'); return; }
    setLoadingView(true);
    try {
      const res = await getSubjectStudents({ subjectId: viewSubjectId });
      setStudentsList(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load student attendance');
    } finally {
      setLoadingView(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading teaching subjects..." />;

  const presentCount = students.filter(s => s.status === 'PRESENT').length;
  const absentCount = students.filter(s => s.status === 'ABSENT').length;
  const notMarkedCount = students.filter(s => s.status === 'NOT_MARKED').length;

  const filteredStudents = studentsList.filter(s =>
    s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSubjectName = assignedSubjects.find(s => s._id === viewSubjectId)?.subjectName || '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-sm text-gray-500">Mark attendance or view students' attendance records for your subjects.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'mark', label: '✏️ Mark Attendance' },
          { key: 'view', label: '👥 Students Attendance' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Mark Attendance ─────────────────────────────────────────────── */}
      {tab === 'mark' && (
        <>
          {/* Subject & Date Selection */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Select Class Session</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[260px] flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Teaching Subject (Only Your Assigned Subjects)
                </label>
                <select
                  className="input-field"
                  value={selectedSubjectId}
                  onChange={(e) => { setSelectedSubjectId(e.target.value); setStudents([]); }}
                >
                  {assignedSubjects.length === 0 && <option value="">No assigned subjects</option>}
                  {assignedSubjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.subjectName} ({sub.subjectCode}) — Sem {sub.semester} {sub.branch}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Session Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <button
                onClick={handleLoadStudents}
                disabled={loadingStudents || !selectedSubjectId}
                className="btn-primary py-2.5 px-6 font-bold"
              >
                {loadingStudents ? 'Loading...' : 'Load Class Students'}
              </button>
            </div>
          </div>

          {/* Students List */}
          {loadingStudents ? (
            <LoadingSpinner message="Fetching students for this class..." />
          ) : students.length > 0 ? (
            <div className="card space-y-4">
              {/* Live Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">✓ Present: {presentCount}</span>
                  <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">✗ Absent: {absentCount}</span>
                  <span className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700">○ Not Marked: {notMarkedCount}</span>
                  <span className="text-gray-500 font-normal">Total: {students.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleMarkAll('PRESENT')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">All Present</button>
                  <button onClick={() => handleMarkAll('ABSENT')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">All Absent</button>
                  <button onClick={() => handleMarkAll('NOT_MARKED')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-700">Do Not Mark All</button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">#</th>
                      <th className="table-header text-left">Enrollment No.</th>
                      <th className="table-header text-left">Student Name</th>
                      <th className="table-header text-center">Attendance Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((st, index) => {
                      const isPresent = st.status === 'PRESENT';
                      const isAbsent = st.status === 'ABSENT';
                      const isNotMarked = st.status === 'NOT_MARKED';
                      return (
                        <tr key={st.studentId} className={`transition-colors ${isPresent ? 'bg-emerald-50/40' : isAbsent ? 'bg-rose-50/40' : 'hover:bg-gray-50'}`}>
                          <td className="table-cell text-gray-400 font-mono text-xs">{index + 1}</td>
                          <td className="table-cell font-mono font-bold text-gray-800">{st.enrollmentNumber}</td>
                          <td className="table-cell font-semibold text-gray-900">{st.fullName}</td>
                          <td className="table-cell">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => setStudentStatus(st.studentId, 'PRESENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPresent ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400' : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-800'}`}>
                                ✓ Present
                              </button>
                              <button onClick={() => setStudentStatus(st.studentId, 'ABSENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAbsent ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400' : 'bg-gray-100 text-gray-600 hover:bg-rose-100 hover:text-rose-800'}`}>
                                ✗ Absent
                              </button>
                              <button onClick={() => setStudentStatus(st.studentId, 'NOT_MARKED')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isNotMarked ? 'bg-slate-700 text-white font-bold shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`}>
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
                <button onClick={handleSaveAttendance} disabled={saving} className="btn-primary py-3 px-8 text-base font-bold shadow-lg">
                  {saving ? 'Saving Records...' : 'Save Class Attendance'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Class Session Loaded"
              description="Select your teaching subject and date above, then click 'Load Class Students'."
            />
          )}
        </>
      )}

      {/* ─── TAB: Students Attendance View ────────────────────────────────────── */}
      {tab === 'view' && (
        <>
          {/* Subject Selector */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Select Subject to View</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[260px] flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">Your Teaching Subject</label>
                <select
                  className="input-field"
                  value={viewSubjectId}
                  onChange={(e) => { setViewSubjectId(e.target.value); setStudentsList([]); setSearchQuery(''); }}
                >
                  {assignedSubjects.length === 0 && <option value="">No assigned subjects</option>}
                  {assignedSubjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.subjectName} ({sub.subjectCode}) — Sem {sub.semester} {sub.branch}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleLoadStudentsAttendance} disabled={loadingView || !viewSubjectId} className="btn-primary py-2.5 px-6 font-bold">
                {loadingView ? 'Loading...' : 'View Students Attendance'}
              </button>
            </div>
          </div>

          {/* Search */}
          {studentsList.length > 0 && (
            <div className="flex items-center gap-3">
              <input
                type="text"
                className="input-field max-w-sm"
                placeholder="Search by name or enrollment no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="text-sm text-gray-500">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Students Attendance Table */}
          {loadingView ? (
            <LoadingSpinner message="Fetching attendance data..." />
          ) : studentsList.length > 0 ? (
            <div className="card overflow-x-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-800">Students Attendance — {selectedSubjectName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Subject-specific and overall attendance for all enrolled students</p>
                </div>
                <div className="flex gap-4 text-xs font-medium">
                  <span className="text-green-600">■ ≥75% Good</span>
                  <span className="text-yellow-600">■ 60–74% Warning</span>
                  <span className="text-red-600">■ &lt;60% Critical</span>
                </div>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header text-left">#</th>
                    <th className="table-header text-left">Enrollment No.</th>
                    <th className="table-header text-left">Student Name</th>
                    <th className="table-header text-center">Sec</th>
                    <th className="table-header text-center" colSpan={4}>
                      This Subject Attendance
                    </th>
                    <th className="table-header text-center" colSpan={2}>
                      Overall Attendance
                    </th>
                  </tr>
                  <tr className="bg-gray-50/70">
                    <th className="table-header" colSpan={4}></th>
                    <th className="table-header text-center text-green-700">Total</th>
                    <th className="table-header text-center text-green-700">Present</th>
                    <th className="table-header text-center text-red-600">Absent</th>
                    <th className="table-header text-center">%</th>
                    <th className="table-header text-center">Total Classes</th>
                    <th className="table-header text-center">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((st, i) => {
                    const sp = st.subjectAttendance;
                    const op = st.overallAttendance;
                    return (
                      <tr key={st.studentId} className="hover:bg-gray-50 transition-colors">
                        <td className="table-cell text-gray-400 font-mono text-xs">{i + 1}</td>
                        <td className="table-cell font-mono font-bold text-gray-800">{st.enrollmentNumber}</td>
                        <td className="table-cell font-semibold text-gray-900">{st.fullName}</td>
                        <td className="table-cell text-center text-xs text-gray-500">{st.section || '—'}</td>
                        {/* Subject attendance */}
                        <td className="table-cell text-center">{sp.total || 0}</td>
                        <td className="table-cell text-center font-medium text-green-600">{sp.present || 0}</td>
                        <td className="table-cell text-center font-medium text-red-500">{sp.absent || 0}</td>
                        <td className="table-cell text-center">
                          {sp.percentage != null ? (
                            <span className={`badge ${pctBadge(sp.percentage)}`}>
                              {sp.percentage}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No classes</span>
                          )}
                        </td>
                        {/* Overall attendance */}
                        <td className="table-cell text-center text-gray-600">{op.total || 0}</td>
                        <td className="table-cell text-center">
                          {op.percentage != null ? (
                            <span className={`font-bold text-sm ${pctColor(op.percentage)}`}>
                              {op.percentage}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredStudents.length === 0 && (
                <div className="text-center py-10 text-gray-400">No students match your search</div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No Data Loaded"
              description="Select a subject above and click 'View Students Attendance' to see all students' attendance records."
            />
          )}
        </>
      )}
    </div>
  );
}
