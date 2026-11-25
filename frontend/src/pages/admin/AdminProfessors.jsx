import React, { useState, useEffect } from 'react';
import { getAll, create, update, remove } from '../../services/professorService';
import { getAll as getSubjects } from '../../services/subjectService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, XMarkIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT'];
const COURSES = ['B.Tech', 'BCA', 'MCA', 'M.Tech'];

const EMPTY_FORM = {
  fullName: '',
  email: '',
  employeeId: '',
  phone: '',
  department: 'CSE',
  course: 'B.Tech',
  assignedSubjects: [],
  password: 'Prof@123'
};

export default function AdminProfessors() {
  const [data, setData] = useState({ docs: [], totalPages: 1, page: 1 });
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', department: '', course: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchProfessors(1);
    fetchSubjectsList();
  }, [filters.search, filters.department, filters.course]);

  const fetchSubjectsList = async () => {
    try {
      const res = await getSubjects({ limit: 100 });
      setAllSubjects(res.data.data?.docs || res.data.data || []);
    } catch {}
  };

  const fetchProfessors = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAll({ page, limit: 10, ...filters });
      const d = res.data.data;
      setData({ docs: d?.docs || [], page: d?.page || 1, totalPages: d?.totalPages || 1 });
    } catch (err) {
      toast.error('Failed to load faculty list');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (prof = null) => {
    if (prof) {
      setEditingProf(prof);
      setFormData({
        fullName: prof.fullName,
        email: prof.email,
        employeeId: prof.employeeId,
        phone: prof.phone || '',
        department: prof.department || 'CSE',
        course: prof.course || 'B.Tech',
        assignedSubjects: prof.assignedSubjects ? prof.assignedSubjects.map(s => s._id || s) : [],
        password: ''
      });
    } else {
      setEditingProf(null);
      setFormData({
        ...EMPTY_FORM,
        employeeId: `PROF${Math.floor(100 + Math.random() * 900)}`
      });
    }
    setIsModalOpen(true);
  };

  const handleSubjectCheckboxToggle = (subjectId) => {
    setFormData(prev => {
      const exists = prev.assignedSubjects.includes(subjectId);
      return {
        ...prev,
        assignedSubjects: exists
          ? prev.assignedSubjects.filter(id => id !== subjectId)
          : [...prev.assignedSubjects, subjectId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProf) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await update(editingProf._id, payload);
        toast.success('Professor updated successfully');
      } else {
        await create(formData);
        toast.success('Professor ID generated successfully!');
      }
      setIsModalOpen(false);
      fetchProfessors(data.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await remove(deleteDialog.id);
      toast.success('Professor deactivated successfully');
      setDeleteDialog({ isOpen: false, id: null });
      fetchProfessors(data.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Faculty & Professors</h1>
          <p className="text-sm text-gray-500">
            Generate Professor IDs and assign subjects they teach. Professors can only access their assigned subjects.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2 font-bold shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          Generate Professor ID
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card flex flex-wrap gap-4 items-center">
        <SearchInput
          value={filters.search}
          onChange={v => setFilters({ ...filters, search: v })}
          placeholder="Search name, ID, or email..."
        />

        <select
          className="input-field w-auto min-w-[160px]"
          value={filters.department}
          onChange={e => setFilters({ ...filters, department: e.target.value })}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          className="input-field w-auto min-w-[160px]"
          value={filters.course}
          onChange={e => setFilters({ ...filters, course: e.target.value })}
        >
          <option value="">All Courses</option>
          {COURSES.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading faculty..." />
      ) : data.docs.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header text-left">Prof ID</th>
                  <th className="table-header text-left">Full Name</th>
                  <th className="table-header text-left">Email</th>
                  <th className="table-header text-center">Department</th>
                  <th className="table-header text-left">Assigned Subjects</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.docs.map(p => {
                  const subs = p.assignedSubjects || [];
                  return (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono font-bold text-emerald-700">{p.employeeId}</td>
                      <td className="table-cell font-semibold text-gray-900">{p.fullName}</td>
                      <td className="table-cell text-gray-600">{p.email}</td>
                      <td className="table-cell text-center">
                        <span className="badge badge-blue">{p.department}</span>
                      </td>
                      <td className="table-cell">
                        {subs.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">None assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {subs.map(s => (
                              <span
                                key={s._id}
                                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border"
                              >
                                {s.subjectCode}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge ${p.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                          {p.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(p)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Professor"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ isOpen: true, id: p._id })}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Deactivate Professor"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t">
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              onPageChange={fetchProfessors}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Professors Found"
          description="Click 'Generate Professor ID' to create credentials and assign teaching subjects to faculty members."
          actionLabel="Generate Professor ID"
          onAction={() => openModal()}
        />
      )}

      {/* Modal: Generate / Edit Professor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProf ? 'Edit Professor Profile & Subjects' : 'Generate New Professor ID'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Verma"
                    className="input-field"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Professor / Employee ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProf}
                    placeholder="e.g. PROF101"
                    className="input-field uppercase font-mono"
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. prof.rajesh@college.edu"
                    className="input-field"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876500001"
                    className="input-field"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department *</label>
                  <select
                    className="input-field"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Course *</label>
                  <select
                    className="input-field"
                    value={formData.course}
                    onChange={e => setFormData({ ...formData, course: e.target.value })}
                  >
                    {COURSES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {editingProf ? 'Update Password (leave blank to keep current)' : 'Account Password *'}
                </label>
                <input
                  type="password"
                  required={!editingProf}
                  placeholder={editingProf ? '••••••••' : 'Default: Prof@123'}
                  className="input-field"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Assigned Subjects Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Assign Teaching Subjects * (Select all subjects this professor teaches)
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  The professor will only be able to mark attendance, add marks, and upload materials for selected subjects.
                </p>

                <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50/50">
                  {allSubjects.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No subjects available to assign.</p>
                  ) : (
                    allSubjects.map(sub => {
                      const isChecked = formData.assignedSubjects.includes(sub._id);
                      return (
                        <label
                          key={sub._id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isChecked ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            checked={isChecked}
                            onChange={() => handleSubjectCheckboxToggle(sub._id)}
                          />
                          <span className="font-mono font-bold text-emerald-800">{sub.subjectCode}</span>
                          <span className="font-semibold text-gray-800">{sub.subjectName}</span>
                          <span className="text-gray-400 ml-auto">
                            Sem {sub.semester} · {sub.branch}
                          </span>
                        </label>
                      );
                    })
                  )}
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
                  {editingProf ? 'Update Professor' : 'Generate Professor ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Deactivate Professor"
        message="Are you sure you want to deactivate this professor? They will lose access to the portal and their assigned subjects will be unlinked."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  );
}
