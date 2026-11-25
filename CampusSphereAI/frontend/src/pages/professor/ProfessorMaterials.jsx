import React, { useState, useEffect, useRef } from 'react';
import { getMe } from '../../services/professorService';
import { getAll, upload, remove, getDownloadUrl } from '../../services/materialService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

const MATERIAL_TYPES = [
  { value: 'NOTES', label: 'Notes', color: 'badge-blue' },
  { value: 'ASSIGNMENT', label: 'Assignment', color: 'badge-purple' },
  { value: 'MST_PAPER', label: 'Old MST Paper', color: 'badge-yellow' },
  { value: 'UNIT_TEST_PAPER', label: 'Old Unit Test Paper', color: 'badge-green' },
  { value: 'UNIVERSITY_PAPER', label: 'Old University Paper', color: 'badge-red' },
  { value: 'IMP_QUESTIONS', label: 'Important Question Paper', color: 'badge-orange' },
];

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

export default function ProfessorMaterials() {
  const [data, setData] = useState({ docs: [], totalPages: 1, page: 1 });
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', subjectId: '', materialType: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    materialType: 'NOTES',
    semester: 5,
    academicYear: '2024-25'
  });
  const fileInputRef = useRef(null);

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchProfAndSubjects();
  }, []);

  useEffect(() => {
    fetchMaterials(1);
  }, [filters.search, filters.subjectId, filters.materialType]);

  const fetchProfAndSubjects = async () => {
    try {
      const res = await getMe();
      const subs = res.data.data?.assignedSubjects || [];
      setAssignedSubjects(subs);
      if (subs.length > 0) {
        setFormData(prev => ({
          ...prev,
          subjectId: subs[0]._id,
          semester: subs[0].semester || 5
        }));
      }
    } catch (err) {
      toast.error('Failed to load teaching subjects');
    }
  };

  const fetchMaterials = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAll({ page, limit: 12, ...filters });
      const d = res.data.data;
      setData({ docs: d?.docs || [], page: d?.page || 1, totalPages: d?.totalPages || 1 });
    } catch (err) {
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a document file');
    if (!formData.subjectId) return toast.error('Please select an assigned subject');

    setUploading(true);
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => form.append(key, formData[key]));
      form.append('file', file);

      await upload(form);
      toast.success('Study material uploaded successfully!');
      setIsModalOpen(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMaterials(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await remove(deleteDialog.id);
      toast.success('Study material deleted successfully');
      setDeleteDialog({ isOpen: false, id: null });
      fetchMaterials(data.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teaching Study Materials</h1>
          <p className="text-sm text-gray-500">
            Upload Notes, Assignments, Old MST Papers, Old Unit Test Papers, Old University Papers, and Imp Questions.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 font-bold shadow-md"
        >
          <ArrowUpTrayIcon className="w-5 h-5" />
          Upload New Material
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card flex flex-wrap gap-4 items-center">
        <SearchInput
          value={filters.search}
          onChange={v => setFilters({ ...filters, search: v })}
          placeholder="Search by title..."
        />

        <select
          className="input-field w-auto min-w-[200px]"
          value={filters.subjectId}
          onChange={e => setFilters({ ...filters, subjectId: e.target.value })}
        >
          <option value="">All Subjects</option>
          {assignedSubjects.map(s => (
            <option key={s._id} value={s._id}>
              {s.subjectName} ({s.subjectCode})
            </option>
          ))}
        </select>

        <select
          className="input-field w-auto min-w-[200px]"
          value={filters.materialType}
          onChange={e => setFilters({ ...filters, materialType: e.target.value })}
        >
          <option value="">All Material Types</option>
          {MATERIAL_TYPES.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <LoadingSpinner message="Loading materials..." />
      ) : data.docs.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.docs.map(item => {
              const typeConfig = MATERIAL_TYPES.find(t => t.value === item.materialType) || {
                label: item.materialType,
                color: 'badge-gray'
              };

              return (
                <div key={item._id} className="card flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`badge ${typeConfig.color} text-[11px] font-bold`}>
                        {typeConfig.label}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {item.uploadDate ? format(new Date(item.uploadDate), 'dd MMM yyyy') : '—'}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-base line-clamp-2">{item.title}</h4>
                    <p className="text-xs font-semibold text-emerald-800 mt-1">
                      {item.subject?.subjectName} ({item.subject?.subjectCode})
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-mono">{formatSize(item.fileSize)}</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={getDownloadUrl(item._id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        Download
                      </a>
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, id: item._id })}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete material"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={fetchMaterials}
          />
        </div>
      ) : (
        <EmptyState
          title="No Study Materials Found"
          description="Click 'Upload New Material' above to share lecture notes, previous question papers, or assignments with your students."
          actionLabel="Upload Material"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Upload Teaching Material</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3 Trees & Graphs Notes, MST 1 2023 Paper"
                  className="input-field"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Teaching Subject *</label>
                <select
                  required
                  className="input-field"
                  value={formData.subjectId}
                  onChange={e => {
                    const subId = e.target.value;
                    const sub = assignedSubjects.find(s => s._id === subId);
                    setFormData({
                      ...formData,
                      subjectId: subId,
                      semester: sub?.semester || 5
                    });
                  }}
                >
                  {assignedSubjects.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.subjectName} ({s.subjectCode}) — Sem {s.semester}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Material Category *</label>
                  <select
                    required
                    className="input-field"
                    value={formData.materialType}
                    onChange={e => setFormData({ ...formData, materialType: e.target.value })}
                  >
                    {MATERIAL_TYPES.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Semester *</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    className="input-field"
                    value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Year *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024-25"
                  className="input-field"
                  value={formData.academicYear}
                  onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Additional context or instructions for students..."
                  className="input-field"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Choose File * (Max 10MB)</label>
                <input
                  type="file"
                  required
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Supported formats: PDF, Word, PowerPoint, Excel, JPG, PNG
                </p>
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
                  disabled={uploading}
                  className="btn-primary font-bold"
                >
                  {uploading ? 'Uploading File...' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Study Material"
        message="Are you sure you want to permanently delete this material? Students will no longer be able to download it."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  );
}
