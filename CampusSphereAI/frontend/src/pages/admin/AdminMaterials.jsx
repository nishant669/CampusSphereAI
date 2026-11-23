import React, { useState, useEffect, useRef } from 'react'
import { getAll, upload, remove, getDownloadUrl } from '../../services/materialService'
import { getAll as getSubjects } from '../../services/subjectService'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import SearchInput from '../../components/SearchInput'
import Pagination from '../../components/Pagination'
import ConfirmDialog from '../../components/ConfirmDialog'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ArrowDownTrayIcon, TrashIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'

const MATERIAL_TYPES = ['NOTES', 'ASSIGNMENT', 'MST_PAPER', 'UNIT_TEST_PAPER', 'UNIVERSITY_PAPER', 'IMP_QUESTIONS']

export default function AdminMaterials() {
  const [data, setData] = useState({ docs: [], totalPages: 1, page: 1 })
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', subjectId: '', type: '' })
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [formData, setFormData] = useState({ title: '', description: '', subjectId: '', materialType: 'NOTES', semester: 1, academicYear: new Date().getFullYear().toString() })
  const fileInputRef = useRef(null)

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null })

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    fetchMaterials(1)
  }, [filters.search, filters.subjectId, filters.materialType])

  const fetchSubjects = async () => {
    try {
      const res = await getSubjects({ limit: 100 })
      setSubjects(res.data.data?.docs || res.data.data || [])
    } catch (err) {}
  }

  const fetchMaterials = async (page = 1) => {
    setLoading(true)
    try {
      const res = await getAll({ page, limit: 12, ...filters })
      const d = res.data.data; setData({ docs: d?.docs || [], page: d?.page || 1, totalPages: d?.totalPages || 1 })
    } catch (err) {
      toast.error('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        e.target.value = ''
        setFile(null)
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    
    setUploading(true)
    try {
      const form = new FormData()
      Object.keys(formData).forEach(key => form.append(key, formData[key]))
      form.append('file', file)
      
      await upload(form)
      toast.success('Material uploaded successfully')
      setIsModalOpen(false)
      setFile(null)
      setFormData({ title: '', description: '', subjectId: '', materialType: 'NOTES', semester: 1, academicYear: new Date().getFullYear().toString() })
      fetchMaterials(data.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await remove(deleteDialog.id)
      toast.success('Material deleted successfully')
      setDeleteDialog({ isOpen: false, id: null })
      fetchMaterials(data.page)
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const getTypeBadge = (type) => {
    const types = { NOTES: 'badge-blue', ASSIGNMENT: 'badge-purple', MST_PAPER: 'badge-orange', UNIT_TEST_PAPER: 'badge-yellow', UNIVERSITY_PAPER: 'badge-red' }
    return types[type] || 'badge-gray'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">Upload Material</button>
      </div>

      <div className="card flex flex-wrap gap-4 items-center">
        <SearchInput value={filters.search} onChange={v => setFilters({...filters, search: v})} placeholder="Search titles..." />
        <select className="input-field w-auto min-w-[200px]" value={filters.subjectId} onChange={e => setFilters({...filters, subjectId: e.target.value})}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
        </select>
        <select className="input-field w-auto min-w-[200px]" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
          <option value="">All Types</option>
          {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : data.docs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.docs.map(item => (
              <div key={item._id} className="card flex flex-col h-full hover:shadow-md transition-shadow relative group">
                <button 
                  onClick={() => setDeleteDialog({ isOpen: true, id: item._id })}
                  className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>

                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${item.materialType === 'NOTES' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                  <span className={`badge ${getTypeBadge(item.materialType)} text-[10px] mr-8`}>
                    {item.materialType.replace(/_/g, ' ')}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 pr-8">{item.title}</h4>
                <p className="text-sm text-gray-500 mb-3">{item.subject?.subjectName}</p>
                {item.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{item.description}</p>}
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>{format(new Date(item.createdAt), 'dd MMM yyyy')}</span>
                  <span>{formatSize(item.fileSize)}</span>
                </div>
                
                <a 
                  href={getDownloadUrl(item._id)} 
                  download
                  className="mt-4 flex items-center justify-center gap-2 w-full btn-secondary text-sm"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" /> Download
                </a>
              </div>
            ))}
          </div>
          <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={fetchMaterials} />
        </>
      ) : <EmptyState title="No materials found" />}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">Upload Material</h3>
              <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input type="text" required className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <select required className="input-field" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Material Type *</label>
                <select required className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Semester *</label>
                  <select required className="input-field" value={formData.semester} onChange={e => setFormData({...formData, semester: Number(e.target.value)})}>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Academic Year</label>
                  <input type="text" required className="input-field" value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="input-field py-2 min-h-[80px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">File (Max 10MB) *</label>
                <input 
                  type="file" 
                  required 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                />
                {file && <p className="text-xs text-green-600 mt-2">Selected: {file.name} ({formatSize(file.size)})</p>}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Material"
        message="Are you sure you want to delete this material? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  )
}


