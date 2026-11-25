import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const paperLinks = [
  { name: 'RGPV subject-wise paper search', detail: 'Search by degree, branch, semester and subject code; open available year-wise PDFs.', url: 'https://rgpvquestionpapers.in/find-papers' },
  { name: 'RGPV complete paper index', detail: 'Browse the searchable question-paper database and available exam sessions.', url: 'https://rgpvquestionpapers.in/all-papers' },
  { name: 'RGPV session-wise papers', detail: 'Browse papers by JUN / DEC / NOV examination session and year.', url: 'https://rgpvquestionpapers.in/sessions' },
  { name: 'RGPV official website', detail: 'Verify syllabus, notices, examination schedules and official university information.', url: 'https://www.rgpv.ac.in/' },
]
const companies = [
  { name: 'TCS', links: [['TCS iON / NQT', 'https://www.tcsion.com/'], ['Practice coding', 'https://www.hackerrank.com/domains/algorithms']] },
  { name: 'Infosys', links: [['Infosys careers', 'https://www.infosys.com/careers/'], ['Practice problems', 'https://www.geeksforgeeks.org/']] },
  { name: 'Wipro', links: [['Wipro careers', 'https://careers.wipro.com/'], ['Coding practice', 'https://leetcode.com/problemset/']] },
  { name: 'Accenture', links: [['Accenture careers', 'https://www.accenture.com/in-en/careers'], ['Aptitude practice', 'https://www.indiabix.com/']] },
  { name: 'Capgemini', links: [['Capgemini careers', 'https://www.capgemini.com/in-en/careers/'], ['Coding practice', 'https://www.codechef.com/practice']] },
  { name: 'Cognizant', links: [['Cognizant careers', 'https://careers.cognizant.com/'], ['DSA practice', 'https://www.codingninjas.com/studio']] },
]
const coding = [
  ['LeetCode', 'https://leetcode.com/problemset/'], ['GeeksforGeeks', 'https://www.geeksforgeeks.org/practice/'],
  ['HackerRank', 'https://www.hackerrank.com/domains'], ['CodeChef', 'https://www.codechef.com/practice'],
  ['Codeforces', 'https://codeforces.com/problemset'], ['IndiaBIX', 'https://www.indiabix.com/']
]
const Card = ({children}) => <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">{children}</div>

export default function CampusHub() {
  const { user } = useAuth()
  const [tab, setTab] = useState('resources')
  const [assignments, setAssignments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState([])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [semester, setSemester] = useState('1')
  const [dueDate, setDueDate] = useState('')
  const [createFile, setCreateFile] = useState(null)
  const [submitFiles, setSubmitFiles] = useState({})
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [submissions, setSubmissions] = useState([])
  const isTeacher = ['ADMIN', 'PROFESSOR'].includes(user?.role)

  const loadAssignments = async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.all([api.get('/assignments'), api.get('/subjects?limit=100')])
      setAssignments(a.data.data || [])
      setSubjects(s.data.data?.docs || [])
    } catch (e) { setMessage(e.response?.data?.message || 'Could not load assignments.') }
    finally { setLoading(false) }
  }
  useEffect(() => { loadAssignments() }, [])

  const createAssignment = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('title', title); fd.append('description', description); fd.append('subjectId', subjectId)
    fd.append('semester', semester); fd.append('dueDate', dueDate)
    if (createFile) fd.append('file', createFile)
    try {
      await api.post('/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMessage('Assignment published successfully.')
      setTitle(''); setDescription(''); setCreateFile(null); setDueDate('')
      loadAssignments()
    } catch (e) { setMessage(e.response?.data?.message || 'Could not publish assignment.') }
  }
  const submitAssignment = async (id) => {
    const file = submitFiles[id]
    if (!file) { setMessage('Choose a file before submitting.'); return }
    const fd = new FormData(); fd.append('file', file)
    try {
      await api.post(`/assignments/${id}/submit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMessage('Your assignment has been submitted.')
      loadAssignments()
    } catch (e) { setMessage(e.response?.data?.message || 'Submission failed.') }
  }
  const viewSubmissions = async (id) => {
    setSelectedAssignment(id)
    try { const r = await api.get(`/assignments/${id}/submissions`); setSubmissions(r.data.data || []) }
    catch (e) { setMessage(e.response?.data?.message || 'Could not load submissions.') }
  }
  const downloadFile = async (kind, id, name) => {
    try {
      const response = await api.get(`/assignments/files/${kind}/${id}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = name || 'assignment-file'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) { setMessage(e.response?.data?.message || 'Could not download file.') }
  }
  const grade = async (id) => {
    const marks = window.prompt('Enter marks out of 100:')
    if (marks === null) return
    const feedback = window.prompt('Feedback (optional):') || ''
    try { await api.patch(`/assignments/submissions/${id}/grade`, { marks: Number(marks), feedback }); await viewSubmissions(selectedAssignment); setMessage('Submission graded.') }
    catch (e) { setMessage(e.response?.data?.message || 'Could not grade submission.') }
  }
  const askAI = async (e) => {
    e.preventDefault()
    if (!question.trim()) return
    const q = question.trim(); setQuestion(''); setChat(c => [...c, { role: 'user', text: q }]); setAsking(true)
    try {
      const r = await api.post('/ai/chat', { message: q })
      setChat(c => [...c, { role: 'assistant', text: r.data.reply }])
    } catch (e) { setChat(c => [...c, { role: 'assistant', text: e.response?.data?.message || 'Unable to reach the AI assistant.' }]) }
    finally { setAsking(false) }
  }

  return <div className="space-y-6 max-w-6xl mx-auto">
    <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-800 to-violet-700 p-7 text-white">
      <p className="text-indigo-200 text-sm font-semibold tracking-widest uppercase">CampusSphere AI</p>
      <h1 className="text-3xl font-bold mt-2">Your campus. Your learning. Your next opportunity.</h1>
      <p className="text-indigo-100 mt-2 max-w-2xl">Academic resources, placement practice, assignment workflows and an AI study companion in one place.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {[['resources','Learning resources'],['assignments','Assignments'],['assistant','AI assistant']].map(([v,label]) =>
        <button key={v} onClick={() => setTab(v)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab===v?'bg-indigo-700 text-white':'bg-white border text-slate-700 hover:bg-slate-50'}`}>{label}</button>)}
    </div>
    {message && <div className="p-3 rounded-xl bg-indigo-50 text-indigo-800 text-sm flex justify-between">{message}<button onClick={()=>setMessage('')}>×</button></div>}

    {tab === 'resources' && <div className="space-y-6">
      <section><h2 className="text-xl font-bold text-slate-900 mb-3">RGPV previous-year question papers</h2>
        <p className="text-sm text-slate-600 mb-4">Choose branch, semester and subject on the paper portal, then select the required exam year/session to open its available PDF. Availability depends on the archive.</p>
        <div className="grid md:grid-cols-2 gap-4">{paperLinks.map(x=><Card key={x.name}><h3 className="font-bold text-slate-900">{x.name}</h3><p className="text-sm text-slate-600 my-2">{x.detail}</p><a className="text-indigo-700 font-semibold text-sm hover:underline" href={x.url} target="_blank" rel="noreferrer">Open resource ↗</a></Card>)}</div>
      </section>
      <section><h2 className="text-xl font-bold text-slate-900 mb-3">Company placement preparation</h2><div className="grid md:grid-cols-3 gap-4">{companies.map(c=><Card key={c.name}><h3 className="font-bold text-lg">{c.name}</h3><div className="mt-3 space-y-2">{c.links.map(([n,u])=><a key={n} href={u} target="_blank" rel="noreferrer" className="block text-sm text-indigo-700 hover:underline">{n} ↗</a>)}</div></Card>)}</div></section>
      <section><h2 className="text-xl font-bold text-slate-900 mb-3">Coding & aptitude practice</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{coding.map(([n,u])=><a key={n} href={u} target="_blank" rel="noreferrer" className="bg-white border rounded-xl p-4 font-semibold text-slate-800 hover:border-indigo-400 hover:text-indigo-700">{n} ↗</a>)}</div></section>
      <p className="text-xs text-slate-500">External RGPV paper archives are independent resources and are not represented as official university services. Always verify academic notices on the official RGPV website.</p>
    </div>}

    {tab === 'assignments' && <div className="space-y-5">
      {isTeacher && <Card><h2 className="font-bold text-lg mb-4">Publish an assignment</h2><form onSubmit={createAssignment} className="grid md:grid-cols-2 gap-3">
        <input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Assignment title" className="border rounded-xl p-3"/>
        <select required value={subjectId} onChange={e=>setSubjectId(e.target.value)} className="border rounded-xl p-3"><option value="">Select subject</option>{subjects.map(s=><option key={s._id} value={s._id}>{s.subjectCode} — {s.subjectName}</option>)}</select>
        <input required type="number" min="1" max="12" value={semester} onChange={e=>setSemester(e.target.value)} placeholder="Semester" className="border rounded-xl p-3"/>
        <input required type="datetime-local" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="border rounded-xl p-3"/>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Instructions / description" className="border rounded-xl p-3 md:col-span-2"/>
        <input type="file" onChange={e=>setCreateFile(e.target.files?.[0])} className="text-sm"/>
        <button className="bg-indigo-700 text-white rounded-xl px-5 py-3 font-semibold">Publish assignment</button>
      </form></Card>}
      <div className="flex items-center justify-between"><h2 className="font-bold text-lg">Assignment board</h2><button onClick={loadAssignments} className="text-sm text-indigo-700">Refresh</button></div>
      {loading ? <p>Loading…</p> : assignments.length===0 ? <Card>No assignments published yet.</Card> : assignments.map(a=><Card key={a._id}>
        <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold text-slate-900">{a.title}</h3><p className="text-sm text-slate-500">{a.subject?.subjectCode} · {a.subject?.subjectName} · Semester {a.semester}</p></div><span className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-full h-fit">Due {new Date(a.dueDate).toLocaleString()}</span></div>
        {a.description && <p className="text-sm text-slate-700 mt-3">{a.description}</p>}
        {a.attachmentName && <button onClick={()=>downloadFile('assignment',a._id,a.attachmentName)} className="text-xs text-indigo-700 mt-2 hover:underline">Download attachment: {a.attachmentName} ↓</button>}
        {user?.role==='STUDENT' && <div className="mt-4 flex flex-wrap gap-2 items-center"><input type="file" onChange={e=>setSubmitFiles(v=>({...v,[a._id]:e.target.files?.[0]}))} className="text-sm"/><button onClick={()=>submitAssignment(a._id)} className="bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm">Submit work</button>{a.mySubmission && <><span className="text-xs font-semibold text-emerald-700">Status: {a.mySubmission.status}{a.mySubmission.marks!==null?` · Marks: ${a.mySubmission.marks}/100`:''}</span><button onClick={()=>downloadFile('submission',a.mySubmission._id,'my-submission')} className="text-xs text-indigo-700">Download my submission</button></>}</div>}
        {isTeacher && <button onClick={()=>viewSubmissions(a._id)} className="mt-4 text-sm font-semibold text-indigo-700">View student submissions →</button>}
      </Card>)}
      {isTeacher && selectedAssignment && <Card><div className="flex justify-between"><h3 className="font-bold">Submissions</h3><button onClick={()=>setSelectedAssignment('')}>Close</button></div>{submissions.length===0?<p className="text-sm text-slate-500 mt-3">No submissions yet.</p>:submissions.map(s=><div key={s._id} className="border-t py-3 mt-3 flex flex-wrap justify-between gap-2"><div><p className="font-semibold">{s.student?.name}</p><p className="text-xs text-slate-500">{s.student?.email} · {s.status} · {new Date(s.submittedAt).toLocaleString()}</p></div><div className="text-sm flex items-center gap-3"><button onClick={()=>downloadFile('submission',s._id,s.fileName)} className="text-indigo-700 font-semibold">Download</button>{s.marks!==null?`${s.marks}/100`:<button onClick={()=>grade(s._id)} className="text-indigo-700 font-semibold">Grade submission</button>}</div></div>)}</Card>}
    </div>}

    {tab === 'assistant' && <Card><div className="mb-4"><h2 className="text-xl font-bold">CampusSphere AI Assistant</h2><p className="text-sm text-slate-500">Ask about study plans, programming, RGPV preparation or placement topics.</p></div>
      <div className="h-96 overflow-y-auto bg-slate-50 rounded-xl p-4 space-y-3">{chat.length===0?<div className="text-slate-500 text-sm">Try: “Create a 30-day DSA placement plan for a beginner.”</div>:chat.map((m,i)=><div key={i} className={`max-w-[90%] rounded-2xl p-3 text-sm whitespace-pre-wrap ${m.role==='user'?'ml-auto bg-indigo-700 text-white':'bg-white border text-slate-800'}`}><b>{m.role==='user'?'You':'CampusSphere AI'}</b><p className="mt-1">{m.text}</p></div>)}
      {asking&&<p className="text-sm text-slate-500">Thinking…</p>}</div>
      <form onSubmit={askAI} className="flex gap-2 mt-3"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask your academic or placement question…" className="flex-1 border rounded-xl px-4 py-3" maxLength={2000}/><button disabled={asking} className="bg-indigo-700 text-white px-5 rounded-xl font-semibold disabled:opacity-50">Send</button></form>
      <p className="text-xs text-slate-500 mt-2">AI responses can be inaccurate. Verify exam dates, paper availability and official college information.</p>
    </Card>}
  </div>
}
