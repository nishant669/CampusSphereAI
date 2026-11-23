import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FunnelIcon,
  CheckIcon,
  ArrowUpIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { getAll, bulkUpdate } from '../../services/studentService';
import { ALL_COURSES, getBranches, SECTIONS, SEMESTERS } from '../../constants/academic.js';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';

const AdminBulkPromote = () => {
  const [filters, setFilters] = useState({
    course: '',
    branch: '',
    semester: '',
    section: '',
  });

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [targetSem, setTargetSem] = useState('');
  const [targetSection, setTargetSection] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null }); // action: 'semester' | 'section'

  const branches = filters.course ? getBranches(filters.course) : [];

  const fetchStudents = async (currentPage = 1, limit = 20) => {
    try {
      setLoading(true);
      const queryParams = { page: currentPage, limit };
      if (filters.course) queryParams.course = filters.course;
      if (filters.branch) queryParams.branch = filters.branch;
      if (filters.semester) queryParams.semester = filters.semester;
      if (filters.section) queryParams.section = filters.section;

      const response = await getAll(queryParams);
      
      const data = response?.docs || response?.data?.docs || response || [];
      const pages = response?.totalPages || response?.data?.totalPages || 1;
      const current = response?.page || response?.data?.page || 1;
      const total = response?.totalDocs || response?.data?.totalDocs || (Array.isArray(data) ? data.length : 0);

      setStudents(Array.isArray(data) ? data : []);
      setTotalPages(pages);
      setPage(current);
      setTotalCount(total);
    } catch (error) {
      console.error('Failed to fetch students', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'course') updated.branch = ''; 
      return updated;
    });
  };

  const applyFilters = () => {
    setSelectedIds(new Set());
    setPage(1);
    fetchStudents(1, 20);
  };

  const resetFilters = () => {
    setFilters({ course: '', branch: '', semester: '', section: '' });
    setSelectedIds(new Set());
    setPage(1);
    fetchStudents(1, 20);
  };

  useEffect(() => {
    fetchStudents(page, 20);
    // eslint-disable-next-line
  }, [page]);

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAllVisible = () => {
    const newSelection = new Set(selectedIds);
    students.forEach(s => newSelection.add(s._id || s.id));
    setSelectedIds(newSelection);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkUpdate = async (type) => {
    if (selectedIds.size === 0) {
      return toast.error('No students selected');
    }
    if (type === 'semester' && !targetSem) {
      return toast.error('Please select a target semester');
    }
    if (type === 'section' && !targetSection) {
      return toast.error('Please select a target section');
    }

    setConfirmModal({ show: true, action: type });
  };

  const confirmAction = async () => {
    const type = confirmModal.action;
    setConfirmModal({ show: false, action: null });
    
    setIsSubmitting(true);
    try {
      const payload = {
        studentIds: Array.from(selectedIds),
      };
      
      if (type === 'semester') {
        payload.semester = Number(targetSem);
      } else if (type === 'section') {
        payload.section = targetSection;
      }

      await bulkUpdate(payload);
      toast.success(`Successfully updated ${selectedIds.size} students`);
      
      setSelectedIds(new Set());
      setTargetSem('');
      setTargetSection('');
      fetchStudents(page, 20);

    } catch (error) {
      console.error('Bulk update failed', error);
      toast.error(error?.response?.data?.message || 'Bulk update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Semester & Section Promoter</h1>
        <p className="mt-1 text-sm text-gray-500">
          Filter students, select them, and promote semester or change section in one click.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="card p-4 bg-white shadow rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900">Filter Students</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              name="course"
              value={filters.course}
              onChange={handleFilterChange}
              className="input-field w-full rounded border-gray-300 shadow-sm p-2 border"
            >
              <option value="">All Courses</option>
              {ALL_COURSES?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
              className="input-field w-full rounded border-gray-300 shadow-sm p-2 border"
              disabled={!filters.course}
            >
              <option value="">All Branches</option>
              {branches?.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              className="input-field w-full rounded border-gray-300 shadow-sm p-2 border"
            >
              <option value="">All Semesters</option>
              {SEMESTERS?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              name="section"
              value={filters.section}
              onChange={handleFilterChange}
              className="input-field w-full rounded border-gray-300 shadow-sm p-2 border"
            >
              <option value="">All Sections</option>
              {SECTIONS?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600 font-medium">
            {totalCount} students found
          </div>
          <div className="space-x-3">
            <button onClick={resetFilters} className="btn-secondary px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 transition">
              Reset
            </button>
            <button onClick={applyFilters} className="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {students.length > 0 && (
        <div className="card p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={selectAllVisible} className="btn-secondary px-3 py-1.5 text-sm border bg-white rounded shadow-sm hover:bg-gray-50 transition">
              Select All
            </button>
            <button onClick={deselectAll} className="btn-secondary px-3 py-1.5 text-sm border bg-white rounded shadow-sm hover:bg-gray-50 transition">
              Deselect All
            </button>
            <span className="text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded border">
              Selected: {selectedIds.size} students
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Promote Action */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 font-medium">Promote to:</span>
              <select
                value={targetSem}
                onChange={e => setTargetSem(e.target.value)}
                className="input-field text-sm py-1.5 rounded border border-gray-300 px-2"
              >
                <option value="">Semester</option>
                {SEMESTERS?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={() => handleBulkUpdate('semester')}
                disabled={isSubmitting || selectedIds.size === 0}
                className="btn-primary flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpIcon className="h-4 w-4" />
                <span>Apply</span>
              </button>
            </div>

            {/* Change Section Action */}
            <div className="flex items-center space-x-2 border-l pl-4 border-gray-300">
              <span className="text-sm text-gray-600 font-medium">Change Section to:</span>
              <select
                value={targetSection}
                onChange={e => setTargetSection(e.target.value)}
                className="input-field text-sm py-1.5 rounded border border-gray-300 px-2"
              >
                <option value="">Section</option>
                {SECTIONS?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={() => handleBulkUpdate('section')}
                disabled={isSubmitting || selectedIds.size === 0}
                className="btn-primary flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded shadow-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UsersIcon className="h-4 w-4" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="card bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-12 flex justify-center"><LoadingSpinner /></div>
        ) : students.length === 0 ? (
          <div className="p-8"><EmptyState title="No students found" message="Try adjusting your filters to find students." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 table-header">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <CheckIcon className="h-4 w-4 inline text-gray-400" />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sem</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, idx) => {
                  const sId = student._id || student.id;
                  const isSelected = selectedIds.has(sId);
                  
                  return (
                    <tr
                      key={sId}
                      onClick={() => toggleSelection(sId)}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-green-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell">
                        {(page - 1) * 20 + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 table-cell">
                        {student.enrollmentNumber || student.enrollment || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 table-cell">
                        {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell">
                        <span className="badge badge-blue px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{student.course || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell">
                        {student.branch || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell">
                        <span className="badge badge-green px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Sem {student.semester || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell">
                        {student.section || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell">
                        {student.cgpa || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && !loading && students.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Warning Dialog */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Bulk Action</h3>
            {confirmModal.action === 'semester' ? (
              <p className="text-sm text-gray-600 mb-6">
                You are about to change semester to <span className="font-bold text-gray-900">{targetSem}</span> for <span className="font-bold text-gray-900">{selectedIds.size}</span> selected students. This cannot be undone easily. Are you sure?
              </p>
            ) : (
              <p className="text-sm text-gray-600 mb-6">
                You are about to change section to <span className="font-bold text-gray-900">{targetSection}</span> for <span className="font-bold text-gray-900">{selectedIds.size}</span> selected students. Are you sure?
              </p>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModal({ show: false, action: null })}
                className="btn-secondary px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isSubmitting}
                className="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {isSubmitting ? (
                   <span className="flex items-center gap-2">
                     <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Applying
                   </span>
                ) : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBulkPromote;
