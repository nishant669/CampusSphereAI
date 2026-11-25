import React, { useState, useEffect } from 'react';
import { getAll as getMarks, saveBulk, remove, getSubmissions, saveBulkSubmissions } from '../../services/marksService';
import { getAll as getSubjects } from '../../services/subjectService';
import { getAll as getStudents } from '../../services/studentService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { TrashIcon } from '@heroicons/react/24/outline';

const EXAM_TYPES = [
  { value: 'MST_1', label: 'MST 1 (Mid-Semester Test 1)', defaultMax: 25 },
  { value: 'MST_2', label: 'MST 2 (Mid-Semester Test 2)', defaultMax: 25 },
  { value: 'MST_3', label: 'MST 3 (Mid-Semester Test 3)', defaultMax: 25 },
  { value: 'UNIT_TEST_1', label: 'Unit Test 1', defaultMax: 10 },
  { value: 'UNIT_TEST_2', label: 'Unit Test 2', defaultMax: 10 },
  { value: 'UNIT_TEST_3', label: 'Unit Test 3', defaultMax: 10 },
];

export default function AdminMarks() {
  const [tab, setTab] = useState('add'); // 'add' | 'view' | 'submissions'
  const [subjects, setSubjects] = useState([]);

  // Tab 1: Add/Update Marks
  const [addForm, setAddForm] = useState({ subjectId: '', examType: 'MST_1' });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // Tab 2: View Marks
  const [viewData, setViewData] = useState({ docs: [], totalPages: 1, page: 1 });
  const [viewFilters, setViewFilters] = useState({ search: '', subjectId: '', examType: '' });
  const [loadingView, setLoadingView] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  // Tab 3: Assignment & Practical Submissions
  const [subSubjectId, setSubSubjectId] = useState('');
  const [submissionsList, setSubmissionsList] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [savingSubmissions, setSavingSubmissions] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (tab === 'view') fetchViewData(1);
  }, [tab, viewFilters.subjectId, viewFilters.examType, viewFilters.search]);

  const fetchSubjects = async () => {
    try {
      const res = await getSubjects({ limit: 100 });
      const subs = res.data.data?.docs || res.data.data || [];
      setSubjects(subs);
      if (subs.length > 0) {
        setAddForm(prev => ({ ...prev, subjectId: subs[0]._id }));
        setSubSubjectId(subs[0]._id);
      }
    } catch {}
  };

  const handleLoadStudentsForMarks = async () => {
    if (!addForm.subjectId || !addForm.examType) return toast.error('Select subject and exam type');
    const selectedSub = subjects.find(s => s._id === addForm.subjectId);
    setLoadingStudents(true);
    try {
      const res = await getStudents({
        branch: selectedSub?.branch,
        semester: selectedSub?.semester,
        limit: 100,
        status: 'ACTIVE'
      });
      const docs = res.data.data?.docs || [];
      const defaultMax = EXAM_TYPES.find(e => e.value === addForm.examType)?.defaultMax || 25;

      setStudents(
        docs.map(s => ({
          studentId: s._id,
          enrollmentNumber: s.enrollmentNumber,
          fullName: s.fullName,
          obtainedMarks: 0,
          maximumMarks: defaultMax,
          remarks: ''
        }))
      );
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleMarkChange = (id, field, value) => {
    setStudents(prev =>
      prev.map(s => (s.studentId === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveBulk = async () => {
    if (!students.length) return toast.error('No marks to save');
    const invalid = students.find(s => Number(s.obtainedMarks) > Number(s.maximumMarks));
    if (invalid) return toast.error(`Marks for ${invalid.fullName} exceed maximum`);

    setSavingMarks(true);
    try {
      await saveBulk({
        subjectId: addForm.subjectId,
        examType: addForm.examType,
        records: students.map(s => ({
          studentId: s.studentId,
          obtainedMarks: Number(s.obtainedMarks),
          maximumMarks: Number(s.maximumMarks),
          remarks: s.remarks
        }))
      });
      toast.success('Marks saved successfully');
    } catch (err) {
      toast.error('Failed to save marks');
    } finally {
      setSavingMarks(false);
    }
  };

  const fetchViewData = async (page = 1) => {
    setLoadingView(true);
    try {
      const res = await getMarks({ page, limit: 10, ...viewFilters });
      const d = res.data.data;
      setViewData({ docs: d?.docs || [], page: d?.page || 1, totalPages: d?.totalPages || 1 });
    } catch (err) {
      toast.error('Failed to load marks');
    } finally {
      setLoadingView(false);
    }
  };

  const handleDelete = async () => {
    try {
      await remove(deleteDialog.id);
      toast.success('Marks record deleted');
      setDeleteDialog({ isOpen: false, id: null });
      fetchViewData(viewData.page);
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // Tab 3 Handlers
  const handleLoadSubmissions = async () => {
    if (!subSubjectId) return toast.error('Select a subject');
    setLoadingSubmissions(true);
    try {
      const res = await getSubmissions({ subjectId: subSubjectId });
      setSubmissionsList(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load submission records');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleToggleSub = (studentId, field) => {
    setSubmissionsList(prev =>
      prev.map(s => (s.studentId === studentId ? { ...s, [field]: !s[field] } : s))
    );
  };

  const handleSaveSubmissions = async () => {
    if (submissionsList.length === 0) return toast.error('No submission records');
    setSavingSubmissions(true);
    try {
      await saveBulkSubmissions({
        subjectId: subSubjectId,
        records: submissionsList
      });
      toast.success('Assignment and practical submission statuses updated!');
    } catch (err) {
      toast.error('Failed to save submissions');
    } finally {
      setSavingSubmissions(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Marks & Submissions</h1>
        <p className="text-sm text-gray-500">
          Add and manage MST 1, 2, 3 and Unit Test 1, 2, 3 marks, and track Assignment & Practical submission status.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            tab === 'add' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('add')}
        >
          ➕ Add / Bulk Marks
        </button>
        <button
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            tab === 'view' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('view')}
        >
          📋 View All Marks
        </button>
        <button
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            tab === 'submissions' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setTab('submissions');
            if (submissionsList.length === 0 && subSubjectId) handleLoadSubmissions();
          }}
        >
          📁 Assignment & Practical Submissions
        </button>
      </div>

      {/* TAB 1: ADD MARKS */}
      {tab === 'add' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-4 items-end">
            <div className="min-w-[260px] flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Subject</label>
              <select
                className="input-field"
                value={addForm.subjectId}
                onChange={e => setAddForm({ ...addForm, subjectId: e.target.value })}
              >
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.subjectName} ({s.subjectCode}) — Sem {s.semester} {s.branch}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[220px]">
              <label className="block text-xs font-bold text-gray-600 mb-1">Exam Type</label>
              <select
                className="input-field"
                value={addForm.examType}
                onChange={e => setAddForm({ ...addForm, examType: e.target.value })}
              >
                {EXAM_TYPES.map(e => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLoadStudentsForMarks}
              disabled={loadingStudents || !addForm.subjectId}
              className="btn-primary py-2.5 px-6 font-bold"
            >
              {loadingStudents ? 'Loading...' : 'Load Students'}
            </button>
          </div>

          {loadingStudents ? (
            <LoadingSpinner message="Fetching students..." />
          ) : students.length > 0 ? (
            <div className="card space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Enrollment</th>
                      <th className="table-header text-left">Student Name</th>
                      <th className="table-header text-center w-36">Obtained Marks</th>
                      <th className="table-header text-center w-36">Max Marks</th>
                      <th className="table-header text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(st => (
                      <tr key={st.studentId} className="hover:bg-gray-50">
                        <td className="table-cell font-mono font-bold text-purple-700">{st.enrollmentNumber}</td>
                        <td className="table-cell font-semibold text-gray-900">{st.fullName}</td>
                        <td className="table-cell text-center">
                          <input
                            type="number"
                            min="0"
                            max={st.maximumMarks}
                            className="input-field py-1 text-center font-bold"
                            value={st.obtainedMarks}
                            onChange={e => handleMarkChange(st.studentId, 'obtainedMarks', e.target.value)}
                          />
                        </td>
                        <td className="table-cell text-center">
                          <input
                            type="number"
                            min="1"
                            className="input-field py-1 text-center bg-gray-50"
                            value={st.maximumMarks}
                            onChange={e => handleMarkChange(st.studentId, 'maximumMarks', e.target.value)}
                          />
                        </td>
                        <td className="table-cell">
                          <input
                            type="text"
                            placeholder="Optional feedback..."
                            className="input-field py-1 text-xs"
                            value={st.remarks || ''}
                            onChange={e => handleMarkChange(st.studentId, 'remarks', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveBulk}
                  disabled={savingMarks}
                  className="btn-primary py-3 px-8 text-base font-bold shadow-lg"
                >
                  {savingMarks ? 'Saving...' : 'Save All Marks'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Students Loaded"
              description="Select subject and exam type above, then click 'Load Students' to record test marks."
            />
          )}
        </div>
      )}

      {/* TAB 2: VIEW MARKS */}
      {tab === 'view' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-4 items-center">
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
              className="input-field w-auto min-w-[200px]"
              value={viewFilters.examType}
              onChange={e => setViewFilters({ ...viewFilters, examType: e.target.value })}
            >
              <option value="">All Exam Types</option>
              {EXAM_TYPES.map(e => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          {loadingView ? (
            <LoadingSpinner message="Loading records..." />
          ) : viewData.docs.length > 0 ? (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Enrollment</th>
                      <th className="table-header text-left">Student</th>
                      <th className="table-header text-left">Subject</th>
                      <th className="table-header text-center">Exam Type</th>
                      <th className="table-header text-center">Marks</th>
                      <th className="table-header text-center">Percentage</th>
                      <th className="table-header text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewData.docs.map(m => {
                      const pct = m.maximumMarks > 0 ? (m.obtainedMarks / m.maximumMarks) * 100 : 0;
                      return (
                        <tr key={m._id} className="hover:bg-gray-50">
                          <td className="table-cell font-mono font-bold text-gray-800">
                            {m.student?.enrollmentNumber || '—'}
                          </td>
                          <td className="table-cell font-semibold text-gray-900">{m.student?.fullName || '—'}</td>
                          <td className="table-cell">{m.subject?.subjectName}</td>
                          <td className="table-cell text-center font-bold text-gray-700">
                            {m.examType?.replace('_', ' ')}
                          </td>
                          <td className="table-cell text-center font-bold text-gray-900">
                            {m.obtainedMarks} / {m.maximumMarks}
                          </td>
                          <td className="table-cell text-center font-bold text-emerald-700">
                            {pct.toFixed(1)}%
                          </td>
                          <td className="table-cell text-center">
                            <button
                              onClick={() => setDeleteDialog({ isOpen: true, id: m._id })}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Delete record"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t">
                <Pagination
                  currentPage={viewData.page}
                  totalPages={viewData.totalPages}
                  onPageChange={fetchViewData}
                />
              </div>
            </div>
          ) : (
            <EmptyState title="No Marks Found" description="No test records match your filter criteria." />
          )}
        </div>
      )}

      {/* TAB 3: SUBMISSIONS */}
      {tab === 'submissions' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-4 items-end">
            <div className="min-w-[280px] flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Subject</label>
              <select
                className="input-field"
                value={subSubjectId}
                onChange={e => setSubSubjectId(e.target.value)}
              >
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.subjectName} ({s.subjectCode}) — Sem {s.semester} {s.branch}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLoadSubmissions}
              disabled={loadingSubmissions || !subSubjectId}
              className="btn-primary py-2.5 px-6 font-bold"
            >
              {loadingSubmissions ? 'Loading...' : 'Load Submissions'}
            </button>
          </div>

          {loadingSubmissions ? (
            <LoadingSpinner message="Fetching submissions..." />
          ) : submissionsList.length > 0 ? (
            <div className="card space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Enrollment</th>
                      <th className="table-header text-left">Student Name</th>
                      <th className="table-header text-center">Assignment Status</th>
                      <th className="table-header text-left">Assignment Remarks</th>
                      <th className="table-header text-center">Practical Status</th>
                      <th className="table-header text-left">Practical Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissionsList.map(st => (
                      <tr key={st.studentId} className="hover:bg-gray-50">
                        <td className="table-cell font-mono font-bold text-purple-700">{st.enrollmentNumber}</td>
                        <td className="table-cell font-semibold text-gray-900">{st.fullName}</td>
                        
                        <td className="table-cell text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSub(st.studentId, 'assignmentSubmitted')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              st.assignmentSubmitted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {st.assignmentSubmitted ? '✓ Submitted' : '○ Pending'}
                          </button>
                        </td>
                        <td className="table-cell">
                          <input
                            type="text"
                            placeholder="Note..."
                            className="input-field py-1 text-xs"
                            value={st.assignmentRemarks || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setSubmissionsList(prev =>
                                prev.map(s => (s.studentId === st.studentId ? { ...s, assignmentRemarks: val } : s))
                              );
                            }}
                          />
                        </td>

                        <td className="table-cell text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSub(st.studentId, 'practicalSubmitted')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              st.practicalSubmitted
                                ? 'bg-indigo-600 text-white'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {st.practicalSubmitted ? '✓ Submitted' : '○ Pending'}
                          </button>
                        </td>
                        <td className="table-cell">
                          <input
                            type="text"
                            placeholder="Lab note..."
                            className="input-field py-1 text-xs"
                            value={st.practicalRemarks || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setSubmissionsList(prev =>
                                prev.map(s => (s.studentId === st.studentId ? { ...s, practicalRemarks: val } : s))
                              );
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveSubmissions}
                  disabled={savingSubmissions}
                  className="btn-primary py-3 px-8 text-base font-bold shadow-lg"
                >
                  {savingSubmissions ? 'Saving...' : 'Save Submissions Status'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Submissions Loaded"
              description="Select a subject above and click 'Load Submissions' to track assignments and practicals."
            />
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Marks Record"
        message="Are you sure you want to delete this mark entry?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  );
}
