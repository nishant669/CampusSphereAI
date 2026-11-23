import React, { useState, useEffect } from 'react'
import { getAll, create, update, remove } from '../../services/subjectService'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import SearchInput from '../../components/SearchInput'
import Pagination from '../../components/Pagination'
import ConfirmDialog from '../../components/ConfirmDialog'
import toast from 'react-hot-toast'
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

const EMPTY_FORM = {
  subjectCode: '', subjectName: '', branch: 'CSE', semester: 1,
  academicYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
  description: ''
}

export default function AdminSubjects() {
  const [docs, setDocs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', branch: '', semester: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null })

  useEffect(() => { fetchSubjects(1) }, [filters.search, filters.branch, filters.semester])

  const fetchSubjects = async (page = 1) => {
    setLoading(true)
    try {
      const res = await getAll({ page, limit: 10, ...filters })
      const d = res.data.data  // paginated: { docs, page, totalPages }
      setDocs(d.docs || [])
      setPagination({ page: d.page || 1, totalPages: d.totalPages || 1 })
    } catch {
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject)
      setFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        branch: subject.branch,
        semester: subject.semester,
        academicYear: subject.academicYear,
        description: subject.description || ''
      })
    } else {
      setEditingSubject(null)
      setFormData(EMPTY_FORM)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSubject) {
        await update(editingSubject._id, formData)
        toast.success('Subject updated successfully')
      } else {
        await create(formData)
        toast.success('Subject created successfully')
      }
      setIsModalOpen(false)
      fetchSubjects(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    try {
      await remove(deleteDialog.id)
      toast.success('Subject deactivated successfully')
      setDeleteDialog({ isOpen: false, id: null })
      fetchSubjects(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Subjects</h2>
          <p className="text-gray-500 text-sm">{docs.length} subjects loaded</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">+ Add Subject</button>
      </div>

      <div className="card flex flex-wrap gap-4 items-center">
        <SearchInput value={filters.search} onChange={v => setFilters({ ...filters, search: v })} placeholder="Search code or name..." />
        <select className="input-field w-auto min-w-[150px]" value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })}>
          <option value="">All Branches</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input-field w-auto min-w-[150px]" value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
          <option value="">All Semesters</option>
          {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : docs.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header text-left">Code</th>
                  <th className="table-header text-left">Name</th>
                  <th className="table-header text-center">Semester</th>
                  <th className="table-header text-center">Branch</th>
                  <th className="table-header text-center">Year</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {docs.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono font-medium text-indigo-700">{s.subjectCode}</td>
                    <td className="table-cell font-medium">{s.subjectName}</td>
                    <td className="table-cell text-center">Sem {s.semester}</td>
                    <td className="table-cell text-center">{s.branch}</td>
                    <td className="table-cell text-center text-gray-500">{s.academicYear}</td>
                    <td className="table-cell text-center">
                      <span className={`badge ${s.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openModal(s)} className="text-indigo-600 hover:text-indigo-800 p-1" title="Edit">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setDeleteDialog({ isOpen: true, id: s._id })} className="text-red-600 hover:text-red-800 p-1" title="Deactivate">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchSubjects} />
          </div>
        </div>
      ) : <EmptyState title="No subjects found" description="Click 'Add Subject' to create your first subject" />}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">{editingSubject ? 'Edit Subject' : 'Add Subject'}</h3>
              <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject Code *</label>
                <input type="text" required className="input-field uppercase"
                  placeholder="e.g. CS501"
                  value={formData.subjectCode}
                  onChange={e => setFormData({ ...formData, subjectCode: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject Name *</label>
                <input type="text" required className="input-field"
                  placeholder="e.g. Data Structures"
                  value={formData.subjectName}
                  onChange={e => setFormData({ ...formData, subjectName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Branch *</label>
                  <select required className="input-field" value={formData.branch}
                    onChange={e => setFormData({ ...formData, branch: e.target.value })}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Semester *</label>
                  <select required className="input-field" value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}>
                    {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Academic Year *</label>
                <input type="text" required className="input-field"
                  placeholder="e.g. 2024-25"
                  value={formData.academicYear}
                  onChange={e => setFormData({ ...formData, academicYear: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="input-field min-h-[80px]" placeholder="Optional description..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Deactivate Subject"
        message="Are you sure? The subject will be hidden but historical data will be preserved."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  )
}

