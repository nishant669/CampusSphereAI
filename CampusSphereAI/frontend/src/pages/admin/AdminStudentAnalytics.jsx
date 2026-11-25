import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalytics } from '../../services/studentService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';
import { ALL_COURSES, SEMESTERS } from '../../constants/academic.js';
import {
  FunnelIcon,
  XMarkIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const ALL_BRANCHES_FLAT = [
  'CSE','ECE','ME','CE','EE','IT','AI & ML','CS & IT',
  'Structural Engg','VLSI','Power Systems',
  'General','Cloud Computing','Data Science',
  'Finance','HR','Marketing','Operations','IT Management',
  'CS','Physics','Chemistry','Mathematics','Biotechnology',
  'Accounting & Finance','Computer Applications',
  'Clinical Pharmacy','Pharmaceutical Chemistry',
  'Paediatric Nursing','Community Health Nursing'
];


const DEFAULT_FILTERS = {
  search: '',
  branch: '',
  semester: '',
  course: '',
  // Attendance: students with attendance <= this %
  maxAttendancePct: '',
  // CGPA: students with CGPA <= maxCgpa
  maxCgpa: '',
  // Marks: students with any MST mark <= this value
  maxMstMarks: '',
  // Marks: students with any Unit Test mark <= this value
  maxUnitTestMarks: '',
};

const pctColor = (pct) => {
  if (pct == null) return 'text-gray-400';
  if (pct >= 75) return 'text-green-600';
  if (pct >= 60) return 'text-yellow-500';
  return 'text-red-600';
};

const pctBadge = (pct) => {
  if (pct == null) return 'badge badge-gray';
  if (pct >= 75) return 'badge badge-green';
  if (pct >= 60) return 'badge badge-yellow';
  return 'badge badge-red';
};

const cgpaBadge = (cgpa) => {
  if (cgpa == null || cgpa === 0) return 'badge badge-gray';
  if (cgpa >= 8) return 'badge badge-green';
  if (cgpa >= 6) return 'badge badge-blue';
  if (cgpa >= 5) return 'badge badge-yellow';
  return 'badge badge-red';
};

export default function AdminStudentAnalytics() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS);
  const [totalFetched, setTotalFetched] = useState(null);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active non-empty filters
  const countActive = (f) =>
    Object.values(f).filter(v => v !== '').length;

  const fetchAnalytics = useCallback(async (appliedFilters) => {
    setLoading(true);
    try {
      const params = {};
      if (appliedFilters.search)           params.search           = appliedFilters.search;
      if (appliedFilters.branch)           params.branch           = appliedFilters.branch;
      if (appliedFilters.semester)         params.semester         = appliedFilters.semester;
      if (appliedFilters.course)           params.course           = appliedFilters.course;
      if (appliedFilters.maxAttendancePct) params.maxAttendancePct = appliedFilters.maxAttendancePct;
      if (appliedFilters.maxCgpa)          params.maxCgpa          = appliedFilters.maxCgpa;
      if (appliedFilters.maxMstMarks)      params.maxMstMarks      = appliedFilters.maxMstMarks;
      if (appliedFilters.maxUnitTestMarks) params.maxUnitTestMarks = appliedFilters.maxUnitTestMarks;

      const res = await getAnalytics(params);
      const data = res.data.data || [];
      setStudents(data);
      setTotalFetched(data.length);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on mount (no filters)
  useEffect(() => {
    fetchAnalytics(DEFAULT_FILTERS);
  }, []);

  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    setActiveFiltersCount(countActive(pendingFilters));
    fetchAnalytics(pendingFilters);
  };

  const handleReset = () => {
    setPendingFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setActiveFiltersCount(0);
    fetchAnalytics(DEFAULT_FILTERS);
  };

  const setP = (key, val) => setPendingFilters(prev => ({ ...prev, [key]: val }));

  // Quick preset filters
  const applyPreset = (preset) => {
    let f = { ...DEFAULT_FILTERS };
    if (preset === 'below75') f.maxAttendancePct = '75';
    if (preset === 'below60') f.maxAttendancePct = '60';
    if (preset === 'below45') f.maxAttendancePct = '45';
    if (preset === 'cgpaBelow6') f.maxCgpa = '6';
    if (preset === 'cgpaBelow5') f.maxCgpa = '5';
    if (preset === 'mstBelow7') f.maxMstMarks = '7';
    if (preset === 'utBelow7') f.maxUnitTestMarks = '7';
    setPendingFilters(f);
    setFilters(f);
    setActiveFiltersCount(countActive(f));
    fetchAnalytics(f);
  };

  const exportCsv = () => {
    if (students.length === 0) { toast.error('No data to export'); return; }
    const headers = ['Enrollment', 'Name', 'Course', 'Branch', 'Sem', 'Section', 'CGPA', 'SGPA', 'Attendance %', 'Min MST Marks', 'Min UT Marks'];
    const rows = students.map(s => [
      s.enrollmentNumber,
      s.fullName,
      s.course || '',
      s.branch,
      s.semester,
      s.section || '',
      s.cgpa ?? '',
      s.lastSemSGPA ?? '',
      s.attendance?.percentage ?? 'N/A',
      s.minMstMarks ?? 'N/A',
      s.minUnitTestMarks ?? 'N/A'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Analytics & Filtering</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Director / HOD view — filter students by attendance, CGPA, and exam performance. Click any student to view their full record.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="btn-secondary flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Quick Preset Filters */}
      <div className="card">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
          Quick Filters (One Click)
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => applyPreset('below75')} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-200 transition-colors">
            🔴 Attendance &lt; 75%
          </button>
          <button onClick={() => applyPreset('below60')} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 transition-colors">
            🚨 Attendance &lt; 60%
          </button>
          <button onClick={() => applyPreset('below45')} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-200 hover:bg-red-300 text-red-900 border border-red-300 transition-colors">
            ⚠️ Attendance &lt; 45%
          </button>
          <button onClick={() => applyPreset('cgpaBelow6')} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 transition-colors">
            📉 CGPA &lt; 6.0
          </button>
          <button onClick={() => applyPreset('cgpaBelow5')} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-200 hover:bg-purple-300 text-purple-900 border border-purple-300 transition-colors">
            📉 CGPA &lt; 5.0
          </button>
          <button onClick={() => applyPreset('mstBelow7')} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 transition-colors">
            📝 Any MST &lt; 7 marks
          </button>
          <button onClick={() => applyPreset('utBelow7')} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-800 border border-teal-200 transition-colors">
            📝 Any Unit Test &lt; 7 marks
          </button>
          <button onClick={handleReset} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors flex items-center gap-1">
            <XMarkIcon className="w-3.5 h-3.5" /> Clear All
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-800">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-600 text-white">
                {activeFiltersCount} active
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-gray-600 mb-1">Search Student</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="Name, enrollment number, email..."
                value={pendingFilters.search}
                onChange={e => setP('search', e.target.value)}
              />
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Branch</label>
            <select className="input-field" value={pendingFilters.branch} onChange={e => setP('branch', e.target.value)}>
              <option value="">All Branches</option>
              {ALL_BRANCHES_FLAT.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Semester</label>
            <select className="input-field" value={pendingFilters.semester} onChange={e => setP('semester', e.target.value)}>
              <option value="">All Semesters</option>
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>

          {/* Course */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Course</label>
            <select className="input-field" value={pendingFilters.course} onChange={e => setP('course', e.target.value)}>
              <option value="">All Courses</option>
              {ALL_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Attendance filter */}
          <div>
            <label className="block text-xs font-bold text-orange-700 mb-1 flex items-center gap-1">
              <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
              Attendance ≤ (%)
            </label>
            <input
              type="number" min="0" max="100"
              className="input-field"
              placeholder="e.g. 75 → shows ≤75%"
              value={pendingFilters.maxAttendancePct}
              onChange={e => setP('maxAttendancePct', e.target.value)}
            />
          </div>

          {/* CGPA filter */}
          <div>
            <label className="block text-xs font-bold text-purple-700 mb-1 flex items-center gap-1">
              <AcademicCapIcon className="w-3.5 h-3.5" />
              CGPA ≤
            </label>
            <input
              type="number" step="0.1" min="0" max="10"
              className="input-field"
              placeholder="e.g. 6 → shows CGPA ≤ 6"
              value={pendingFilters.maxCgpa}
              onChange={e => setP('maxCgpa', e.target.value)}
            />
          </div>

          {/* MST Marks filter */}
          <div>
            <label className="block text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
              <ChartBarIcon className="w-3.5 h-3.5" />
              Any MST Marks ≤
            </label>
            <input
              type="number" min="0"
              className="input-field"
              placeholder="e.g. 7 → scored ≤7 in any MST"
              value={pendingFilters.maxMstMarks}
              onChange={e => setP('maxMstMarks', e.target.value)}
            />
          </div>

          {/* Unit Test Marks filter */}
          <div>
            <label className="block text-xs font-bold text-teal-700 mb-1 flex items-center gap-1">
              <ChartBarIcon className="w-3.5 h-3.5" />
              Any Unit Test Marks ≤
            </label>
            <input
              type="number" min="0"
              className="input-field"
              placeholder="e.g. 7 → scored ≤7 in any UT"
              value={pendingFilters.maxUnitTestMarks}
              onChange={e => setP('maxUnitTestMarks', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <button onClick={handleReset} className="btn-secondary text-sm flex items-center gap-1">
            <XMarkIcon className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleApplyFilters} className="btn-primary text-sm font-bold flex items-center gap-2">
            <FunnelIcon className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      {totalFetched !== null && !loading && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ${
            students.length === 0
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-orange-50 text-orange-700 border border-orange-200'
          }`}>
            {students.length === 0
              ? '✅ No students match the filter criteria'
              : `⚠️ ${students.length} student${students.length !== 1 ? 's' : ''} match the criteria`
            }
          </div>
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.maxAttendancePct && (
                <span className="badge badge-red">Attendance ≤ {filters.maxAttendancePct}%</span>
              )}
              {filters.maxCgpa && (
                <span className="badge badge-purple">CGPA ≤ {filters.maxCgpa}</span>
              )}
              {filters.maxMstMarks && (
                <span className="badge badge-blue">MST ≤ {filters.maxMstMarks} marks</span>
              )}
              {filters.maxUnitTestMarks && (
                <span className="badge badge-blue">Unit Test ≤ {filters.maxUnitTestMarks} marks</span>
              )}
              {filters.branch && (
                <span className="badge badge-gray">Branch: {filters.branch}</span>
              )}
              {filters.semester && (
                <span className="badge badge-gray">Sem: {filters.semester}</span>
              )}
              {filters.course && (
                <span className="badge badge-gray">{filters.course}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      {loading ? (
        <LoadingSpinner message="Analysing student records..." />
      ) : students.length === 0 ? (
        <EmptyState
          title={activeFiltersCount > 0 ? 'No Students Match Criteria' : 'No Students Found'}
          description={activeFiltersCount > 0
            ? 'Great news — no students fall under the selected filter thresholds.'
            : 'All active students will appear here. Apply filters to narrow down.'}
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header text-left">#</th>
                  <th className="table-header text-left">Enrollment</th>
                  <th className="table-header text-left">Student Name</th>
                  <th className="table-header text-center">Course / Branch</th>
                  <th className="table-header text-center">Sem / Sec</th>
                  <th className="table-header text-center">
                    <span className="text-orange-700">Attendance %</span>
                  </th>
                  <th className="table-header text-center">
                    <span className="text-purple-700">CGPA</span>
                  </th>
                  <th className="table-header text-center">
                    <span className="text-blue-700">Min MST</span>
                  </th>
                  <th className="table-header text-center">
                    <span className="text-teal-700">Min UT</span>
                  </th>
                  <th className="table-header text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s, i) => {
                  const att = s.attendance?.percentage;
                  const attWarning = att !== null && att < 75;
                  return (
                    <tr
                      key={s._id}
                      className={`transition-colors hover:bg-gray-50 ${attWarning ? 'bg-red-50/20' : ''}`}
                    >
                      <td className="table-cell text-xs text-gray-400 font-mono">{i + 1}</td>
                      <td className="table-cell font-mono font-bold text-indigo-700 text-sm">
                        {s.enrollmentNumber}
                      </td>
                      <td className="table-cell">
                        <div className="font-semibold text-gray-900">{s.fullName}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </td>
                      <td className="table-cell text-center">
                        <div className="font-medium text-gray-800">{s.course || 'B.Tech'}</div>
                        <div className="text-xs font-mono text-gray-500">{s.branch}</div>
                      </td>
                      <td className="table-cell text-center text-sm">
                        Sem {s.semester}
                        <span className="text-xs text-gray-400 ml-1">· {s.section || 'A'}</span>
                      </td>
                      {/* Attendance */}
                      <td className="table-cell text-center">
                        {att !== null ? (
                          <span className={`${pctBadge(att)} font-bold`}>
                            {att}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No data</span>
                        )}
                      </td>
                      {/* CGPA */}
                      <td className="table-cell text-center">
                        {s.cgpa ? (
                          <span className={cgpaBadge(s.cgpa)}>
                            {Number(s.cgpa).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      {/* Min MST */}
                      <td className="table-cell text-center">
                        {s.minMstMarks !== null && s.minMstMarks !== undefined ? (
                          <span className={`font-bold text-sm ${s.minMstMarks < 10 ? 'text-red-600' : s.minMstMarks < 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {s.minMstMarks}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      {/* Min UT */}
                      <td className="table-cell text-center">
                        {s.minUnitTestMarks !== null && s.minUnitTestMarks !== undefined ? (
                          <span className={`font-bold text-sm ${s.minUnitTestMarks < 5 ? 'text-red-600' : s.minUnitTestMarks < 8 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {s.minUnitTestMarks}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      {/* View Detail */}
                      <td className="table-cell text-center">
                        <button
                          onClick={() => navigate(`/admin/students/${s._id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                          title="View full student record"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          Full Record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-6 text-sm text-gray-600">
            <span>Total students shown: <strong>{students.length}</strong></span>
            <span className="text-orange-600">
              Below 75% attendance: <strong>{students.filter(s => s.attendance?.percentage !== null && s.attendance?.percentage < 75).length}</strong>
            </span>
            <span className="text-red-600">
              Below 60% attendance: <strong>{students.filter(s => s.attendance?.percentage !== null && s.attendance?.percentage < 60).length}</strong>
            </span>
            <span className="text-purple-700">
              CGPA below 6: <strong>{students.filter(s => s.cgpa && s.cgpa < 6).length}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
