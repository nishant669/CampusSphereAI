import React, { useState, useEffect } from 'react';
import { getAll, create, update, remove } from '../../services/studentService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { EyeIcon, PencilIcon, TrashIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { ALL_COURSES, getBranches, SECTIONS, SEMESTERS } from '../../constants/academic.js';

// Keep flat branch list for filter bar (all branches across all courses)
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


const EMPTY_STUDENT_FORM = {
  enrollmentNumber: '',
  fullName: '',
  email: '',
  phone: '',
  course: 'B.Tech',
  branch: 'CSE',
  semester: 1,
  section: 'A',
  academicYear: '2024-25',
  lastSemSGPA: '',
  cgpa: '',
  password: '',
  confirmPassword: '',
  status: 'ACTIVE'
};

export default function AdminStudents() {
  const [data, setData] = useState({ docs: [], totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', course: '', branch: '', semester: '', status: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_STUDENT_FORM);

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents(1);
  }, [filters.search, filters.course, filters.branch, filters.semester, filters.status]);

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAll({ page, limit: 10, ...filters });
      const d = res.data.data;
      setData({ docs: d?.docs || [], page: d?.page || 1, totalPages: d?.totalPages || 1 });
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        enrollmentNumber: student.enrollmentNumber,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone || '',
        course: student.course || 'B.Tech',
        branch: student.branch,
        semester: student.semester,
        section: student.section || 'A',
        academicYear: student.academicYear || '2024-25',
        lastSemSGPA: student.lastSemSGPA !== undefined ? student.lastSemSGPA : '',
        cgpa: student.cgpa !== undefined ? student.cgpa : '',
        password: '',
        confirmPassword: '',
        status: student.status || 'ACTIVE'
      });
    } else {
      setEditingStudent(null);
      setFormData({
        ...EMPTY_STUDENT_FORM,
        enrollmentNumber: `2301${Math.floor(100000 + Math.random() * 900000)}`
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent && !formData.password) {
      return toast.error('Password is required when generating a new student account');
    }
    if (formData.password && formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      const payload = {
        ...formData,
        lastSemSGPA: formData.lastSemSGPA === '' ? 0 : Number(formData.lastSemSGPA),
        cgpa: formData.cgpa === '' ? 0 : Number(formData.cgpa)
      };

      if (editingStudent) {
        if (!payload.password) delete payload.password;
        delete payload.confirmPassword;
        await update(editingStudent._id, payload);
        toast.success('Student profile updated successfully');
      } else {
        delete payload.confirmPassword;
        await create(payload);
        toast.success('Student ID generated successfully!');
      }
      setIsModalOpen(false);
      fetchStudents(data.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await remove(deleteDialog.id);
      toast.success('Student deactivated successfully');
      setDeleteDialog({ isOpen: false, id: null });
      fetchStudents(data.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate student');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Student Records</h1>
          <p className="text-sm text-gray-500">
            Generate student IDs with course, branch, semester, section, and track SGPA / CGPA performance.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2 font-bold shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          Generate Student ID
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card flex flex-wrap gap-4 items-center">
        <SearchInput
          value={filters.search}
          onChange={v => setFilters({ ...filters, search: v })}
          placeholder="Search name, enrollment, or email..."
        />

        <select
          className="input-field w-auto min-w-[130px]"
          value={filters.course}
          onChange={e => setFilters({ ...filters, course: e.target.value })}
        >
          <option value="">All Courses</option>
          {ALL_COURSES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="input-field w-auto min-w-[160px]"
          value={filters.branch}
          onChange={e => setFilters({ ...filters, branch: e.target.value })}
        >
          <option value="">All Branches</option>
          {ALL_BRANCHES_FLAT.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          className="input-field w-auto min-w-[130px]"
          value={filters.semester}
          onChange={e => setFilters({ ...filters, semester: e.target.value })}
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>

        <select
          className="input-field w-auto min-w-[130px]"
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading student records..." />
      ) : data.docs.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header text-left">Enrollment</th>
                  <th className="table-header text-left">Full Name</th>
                  <th className="table-header text-left">Course / Branch</th>
                  <th className="table-header text-center">Sem / Sec</th>
                  <th className="table-header text-center">SGPA / CGPA</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.docs.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono font-bold text-indigo-700">{s.enrollmentNumber}</td>
                    <td className="table-cell font-semibold text-gray-900">
                      <div>{s.fullName}</div>
                      <div className="text-xs text-gray-400 font-normal">{s.email}</div>
                    </td>
                    <td className="table-cell">
                      <span className="font-bold text-gray-800">{s.course || 'B.Tech'}</span>{' '}
                      <span className="text-xs text-gray-500 font-mono">({s.branch})</span>
                    </td>
                    <td className="table-cell text-center">
                      Sem {s.semester} <span className="text-xs text-gray-400">· Sec {s.section || 'A'}</span>
                    </td>
                    <td className="table-cell text-center">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        SGPA: {s.lastSemSGPA ? Number(s.lastSemSGPA).toFixed(2) : '—'}
                      </span>
                      <span className="text-[11px] text-gray-500 ml-1 font-mono">
                        (CGPA: {s.cgpa ? Number(s.cgpa).toFixed(2) : '—'})
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <span className={`badge ${s.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                        {s.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/students/${s._id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Complete Academic Record"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(s)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, id: s._id })}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Deactivate Student"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t">
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              onPageChange={fetchStudents}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Students Found"
          description="Click 'Generate Student ID' to enroll students with course, branch, semester, and performance records."
          actionLabel="Generate Student ID"
          onAction={() => openModal()}
        />
      )}

      {/* Modal: Generate / Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">
                {editingStudent ? 'Edit Student Profile & Performance' : 'Generate New Student ID'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Enrollment Number *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    placeholder="e.g. 2301234567"
                    className="input-field uppercase font-mono"
                    value={formData.enrollmentNumber}
                    onChange={e => setFormData({ ...formData, enrollmentNumber: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="input-field"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@student.college.edu"
                    className="input-field"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    className="input-field"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Course *</label>
                  <select
                    className="input-field"
                    value={formData.course}
                    onChange={e => setFormData({ ...formData, course: e.target.value, branch: getBranches(e.target.value)[0] || '' })}
                  >
                    {ALL_COURSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Branch *</label>
                  <select
                    className="input-field"
                    value={formData.branch}
                    onChange={e => setFormData({ ...formData, branch: e.target.value })}
                  >
                    {getBranches(formData.course).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Semester *</label>
                  <select
                    className="input-field"
                    value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
                  >
                    {SEMESTERS.map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A, B, C"
                    className="input-field"
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-25"
                    className="input-field"
                    value={formData.academicYear}
                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select
                    className="input-field"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active Student</option>
                    <option value="INACTIVE">Inactive / Deactivated</option>
                  </select>
                </div>
              </div>

              {/* Academic Performance (SGPA & CGPA) */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                  Academic Performance Records
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Semester SGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 8.45"
                      className="input-field bg-white"
                      value={formData.lastSemSGPA}
                      onChange={e => setFormData({ ...formData, lastSemSGPA: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Overall CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 8.20"
                      className="input-field bg-white"
                      value={formData.cgpa}
                      onChange={e => setFormData({ ...formData, cgpa: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {editingStudent ? 'Update Password (optional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingStudent ? 'Leave blank to keep current' : 'Default: Student@123'}
                    className="input-field"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    className="input-field"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary font-bold shadow-md"
                >
                  {editingStudent ? 'Update Student Record' : 'Generate Student ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Deactivate Student"
        message="Are you sure you want to deactivate this student? They will no longer be able to log in to the portal."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  );
}
