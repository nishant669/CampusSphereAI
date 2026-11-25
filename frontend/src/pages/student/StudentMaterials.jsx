import React, { useState, useEffect } from 'react'
import { getAll as getMaterials, getDownloadUrl } from '../../services/materialService'
import { getAll as getSubjects } from '../../services/subjectService'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ArrowDownTrayIcon, DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const typeLabel = { NOTES: 'Notes', ASSIGNMENT: 'Assignment', MST_PAPER: 'MST Paper', UNIT_TEST_PAPER: 'Unit Test Paper', UNIVERSITY_PAPER: 'University Paper', IMP_QUESTIONS: 'Imp Questions' }
const typeBadge = { NOTES: 'badge-blue', ASSIGNMENT: 'badge-purple', MST_PAPER: 'badge-yellow', UNIT_TEST_PAPER: 'badge-green', UNIVERSITY_PAPER: 'badge-red', IMP_QUESTIONS: 'badge-gray' }

const formatSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function StudentMaterials() {
  const [materials, setMaterials] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [materialType, setMaterialType] = useState('')

  useEffect(() => {
    getSubjects({ limit: 100 })
      .then(res => setSubjects(res.data.data?.docs || res.data.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchMaterials(1) }, [search, subjectId, materialType])

  const fetchMaterials = async (page = 1) => {
    setLoading(true)
    try {
      const res = await getMaterials({ page, limit: 12, search, subjectId, materialType })
      const d = res.data.data
      // d is paginated object: { docs: [...], totalPages, page }
      setMaterials(d?.docs || d || [])
      setPagination({ page: d?.page || page, totalPages: d?.totalPages || 1 })
    } catch (err) {
      toast.error('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Study Materials</h1>
        <p className="text-gray-500 text-sm">Download notes, assignments and previous year papers</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search materials..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
          </select>
          <select className="input-field" value={materialType} onChange={e => setMaterialType(e.target.value)}>
            <option value="">All Types</option>
            {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : materials.length === 0 ? (
        <EmptyState title="No materials found" description="Try adjusting your search filters" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {materials.map(item => (
              <div key={item._id} className="card flex flex-col h-full hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${item.materialType === 'NOTES' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                  <span className={`badge ${typeBadge[item.materialType] || 'badge-gray'} text-[10px]`}>
                    {typeLabel[item.materialType] || item.materialType}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 flex-1">{item.title}</h4>
                <p className="text-sm text-gray-500 mb-1">{item.subject?.subjectName || '—'}</p>
                {item.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>}

                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>{item.uploadDate ? format(new Date(item.uploadDate), 'dd MMM yyyy') : '—'}</span>
                  <span>{formatSize(item.fileSize)}</span>
                </div>

                <a
                  href={getDownloadUrl(item._id)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full btn-primary text-sm group-hover:bg-indigo-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" /> Download
                </a>
              </div>
            ))}
          </div>
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchMaterials} />
        </>
      )}
    </div>
  )
}
