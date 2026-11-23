import React, { useState, useEffect } from 'react';
import { getMe } from '../../services/professorService';
import { getAll as getStudents } from '../../services/studentService';
import { saveBulk, getSubmissions, saveBulkSubmissions } from '../../services/marksService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const EXAM_TYPES = [
  { value: 'MST_1', label: 'MST 1 (Mid-Semester Test 1)', defaultMax: 25 },
  { value: 'MST_2', label: 'MST 2 (Mid-Semester Test 2)', defaultMax: 25 },
  { value: 'MST_3', label: 'MST 3 (Mid-Semester Test 3)', defaultMax: 25 },
  { value: 'UNIT_TEST_1', label: 'Unit Test 1', defaultMax: 10 },
  { value: 'UNIT_TEST_2', label: 'Unit Test 2', defaultMax: 10 },
  { value: 'UNIT_TEST_3', label: 'Unit Test 3', defaultMax: 10 },
];

export default function ProfessorMarks() {
  const [activeTab, setActiveTab] = useState('marks'); // 'marks' | 'submissions'
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab 1: Exam Marks State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('MST_1');
  const [marksStudents, setMarksStudents] = useState([]);
  const [loadingMarksStudents, setLoadingMarksStudents] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // Tab 2: Assignment & Practical Submissions State
  const [subSubjectId, setSubSubjectId] = useState('');
  const [submissionsList, setSubmissionsList] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [savingSubmissions, setSavingSubmissions] = useState(false);

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
        setSubSubjectId(subjects[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load your assigned subjects');
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Tab 1: Marks Handlers -----------------
  const handleLoadMarksStudents = async () => {
    if (!selectedSubjectId) return toast.error('Select a teaching subject');
    const selectedSub = assignedSubjects.find(s => s._id === selectedSubjectId);
    if (!selectedSub) return;

    setLoadingMarksStudents(true);
    try {
      const res = await getStudents({
        branch: selectedSub.branch,
        semester: selectedSub.semester,
        status: 'ACTIVE',
        limit: 100
      });
      const docs = res.data.data?.docs || [];
      const defaultMax = EXAM_TYPES.find(e => e.value === selectedExamType)?.defaultMax || 25;

      setMarksStudents(
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
      toast.error('Failed to load students for marks entry');
    } finally {
      setLoadingMarksStudents(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarksStudents(prev =>
      prev.map(s => (s.studentId === studentId ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveMarks = async () => {
    if (marksStudents.length === 0) return toast.error('No student marks to save');

    const invalid = marksStudents.find(
      s => Number(s.obtainedMarks) > Number(s.maximumMarks) || Number(s.obtainedMarks) < 0
    );
    if (invalid) {
      toast.error(`Marks for ${invalid.fullName} cannot exceed maximum marks (${invalid.maximumMarks})`);
      return;
    }

    setSavingMarks(true);
    try {
      await saveBulk({
        subjectId: selectedSubjectId,
        examType: selectedExamType,
        records: marksStudents.map(s => ({
          studentId: s.studentId,
          obtainedMarks: Number(s.obtainedMarks),
          maximumMarks: Number(s.maximumMarks),
          remarks: s.remarks
        }))
      });
      toast.success('Exam marks saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSavingMarks(false);
    }
  };

  // ----------------- Tab 2: Submissions Handlers -----------------
  const handleLoadSubmissions = async () => {
    if (!subSubjectId) return toast.error('Select a teaching subject');
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

  const handleToggleSubmission = (studentId, field) => {
    setSubmissionsList(prev =>
      prev.map(s => (s.studentId === studentId ? { ...s, [field]: !s[field] } : s))
    );
  };

  const handleBatchSubmission = (field, val) => {
    setSubmissionsList(prev => prev.map(s => ({ ...s, [field]: val })));
  };

  const handleSaveSubmissions = async () => {
    if (submissionsList.length === 0) return toast.error('No submission records to save');
    setSavingSubmissions(true);
    try {
      await saveBulkSubmissions({
        subjectId: subSubjectId,
        records: submissionsList
      });
      toast.success('Assignment and Practical submission status saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save submissions');
    } finally {
      setSavingSubmissions(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading teaching subjects..." />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Marks & Submissions</h1>
        <p className="text-sm text-gray-500">
          Update MST (1, 2, 3) and Unit Test (1, 2, 3) marks, and track Assignment & Practical submission status.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('marks')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'marks'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 Exam Marks (MST & Unit Tests)
        </button>
        <button
          onClick={() => {
            setActiveTab('submissions');
            if (submissionsList.length === 0 && subSubjectId) handleLoadSubmissions();
          }}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'submissions'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📁 Assignment & Practical Submissions
        </button>
      </div>

      {/* TAB 1: EXAM MARKS */}
      {activeTab === 'marks' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Select Subject & Test</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[260px] flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">Teaching Subject</label>
                <select
                  className="input-field"
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                >
                  {assignedSubjects.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.subjectName} ({s.subjectCode}) — Sem {s.semester} {s.branch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[240px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Exam Type</label>
                <select
                  className="input-field"
                  value={selectedExamType}
                  onChange={e => setSelectedExamType(e.target.value)}
                >
                  {EXAM_TYPES.map(e => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleLoadMarksStudents}
                disabled={loadingMarksStudents || !selectedSubjectId}
                className="btn-primary py-2.5 px-6 font-bold"
              >
                {loadingMarksStudents ? 'Loading...' : 'Load Class Students'}
              </button>
            </div>
          </div>

          {loadingMarksStudents ? (
            <LoadingSpinner message="Fetching students for marks entry..." />
          ) : marksStudents.length > 0 ? (
            <div className="card space-y-4">
              <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900">
                  Total Students: {marksStudents.length} | Test:{' '}
                  {EXAM_TYPES.find(e => e.value === selectedExamType)?.label}
                </span>
                <span className="text-xs text-gray-500 font-medium">Verify marks before saving</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">#</th>
                      <th className="table-header text-left">Enrollment</th>
                      <th className="table-header text-left">Name</th>
                      <th className="table-header text-center w-36">Obtained Marks</th>
                      <th className="table-header text-center w-36">Maximum Marks</th>
                      <th className="table-header text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {marksStudents.map((st, i) => (
                      <tr key={st.studentId} className="hover:bg-gray-50">
                        <td className="table-cell text-gray-400 font-mono text-xs">{i + 1}</td>
                        <td className="table-cell font-mono font-bold text-gray-800">{st.enrollmentNumber}</td>
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
                  onClick={handleSaveMarks}
                  disabled={savingMarks}
                  className="btn-primary py-3 px-8 text-base font-bold shadow-lg"
                >
                  {savingMarks ? 'Saving Marks...' : 'Save All Marks'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Student List Loaded"
              description="Select your subject and exam type above, then click 'Load Class Students' to enter MST or Unit Test marks."
            />
          )}
        </div>
      )}

      {/* TAB 2: ASSIGNMENT & PRACTICAL SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">
              Select Subject for Assignment & Practical Tracking
            </h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[280px] flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1">Teaching Subject</label>
                <select
                  className="input-field"
                  value={subSubjectId}
                  onChange={e => setSubSubjectId(e.target.value)}
                >
                  {assignedSubjects.map(s => (
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
          </div>

          {loadingSubmissions ? (
            <LoadingSpinner message="Fetching submission records..." />
          ) : submissionsList.length > 0 ? (
            <div className="card space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700 flex gap-4">
                  <span>
                    Assignments Submitted:{' '}
                    <strong className="text-emerald-700">
                      {submissionsList.filter(s => s.assignmentSubmitted).length}/{submissionsList.length}
                    </strong>
                  </span>
                  <span>
                    Practicals Submitted:{' '}
                    <strong className="text-indigo-700">
                      {submissionsList.filter(s => s.practicalSubmitted).length}/{submissionsList.length}
                    </strong>
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleBatchSubmission('assignmentSubmitted', true)}
                    className="px-3 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold"
                  >
                    All Assignments Done
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchSubmission('practicalSubmitted', true)}
                    className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold"
                  >
                    All Practicals Done
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">#</th>
                      <th className="table-header text-left">Enrollment</th>
                      <th className="table-header text-left">Name</th>
                      <th className="table-header text-center">Assignment Status</th>
                      <th className="table-header text-left">Assignment Remarks</th>
                      <th className="table-header text-center">Practical Status</th>
                      <th className="table-header text-left">Practical Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissionsList.map((st, i) => (
                      <tr key={st.studentId} className="hover:bg-gray-50">
                        <td className="table-cell text-gray-400 font-mono text-xs">{i + 1}</td>
                        <td className="table-cell font-mono font-bold text-gray-800">{st.enrollmentNumber}</td>
                        <td className="table-cell font-semibold text-gray-900">{st.fullName}</td>
                        
                        {/* Assignment Toggle */}
                        <td className="table-cell text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSubmission(st.studentId, 'assignmentSubmitted')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              st.assignmentSubmitted
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {st.assignmentSubmitted ? '✓ Submitted' : '○ Pending'}
                          </button>
                        </td>
                        <td className="table-cell">
                          <input
                            type="text"
                            placeholder="Assignment note..."
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

                        {/* Practical Toggle */}
                        <td className="table-cell text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSubmission(st.studentId, 'practicalSubmitted')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              st.practicalSubmitted
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {st.practicalSubmitted ? '✓ Submitted' : '○ Pending'}
                          </button>
                        </td>
                        <td className="table-cell">
                          <input
                            type="text"
                            placeholder="Practical/Lab note..."
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
                  {savingSubmissions ? 'Saving Submissions...' : 'Save Submissions Status'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Submissions Loaded"
              description="Select your subject above and click 'Load Submissions' to view and mark assignment and practical records."
            />
          )}
        </div>
      )}
    </div>
  );
}
