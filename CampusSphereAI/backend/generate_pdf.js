const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const outputPath = path.join(__dirname, '..', 'College_Academic_Portal_PPT_Content.pdf')
const doc = new PDFDocument({ margin: 50, size: 'A4' })
doc.pipe(fs.createWriteStream(outputPath))

// ─── COLOR PALETTE ───────────────────────────────────────────
const INDIGO   = '#4F46E5'
const PURPLE   = '#7C3AED'
const GRAY     = '#374151'
const LIGHT    = '#F3F4F6'
const WHITE    = '#FFFFFF'
const GREEN    = '#059669'
const RED      = '#DC2626'
const ORANGE   = '#D97706'
const BLUE     = '#2563EB'

// ─── HELPERS ─────────────────────────────────────────────────
let slideNo = 0

function newSlide(title, accent = INDIGO) {
  if (slideNo > 0) doc.addPage()
  slideNo++

  // Header bar
  doc.rect(0, 0, doc.page.width, 60).fill(accent)

  // Slide number badge
  doc.fillColor(WHITE).fontSize(10)
     .text(`${slideNo}`, doc.page.width - 70, 22, { width: 40, align: 'right' })

  // Title
  doc.fillColor(WHITE).fontSize(18).font('Helvetica-Bold')
     .text(title, 50, 18, { width: doc.page.width - 110 })

  doc.moveDown(0.5)
  doc.fillColor(GRAY).font('Helvetica').fontSize(11)
  doc.y = 80
}

function sectionHeader(text, color = INDIGO) {
  doc.moveDown(0.4)
  doc.fillColor(color).fontSize(12).font('Helvetica-Bold').text(text)
  doc.moveDown(0.2)
  doc.fillColor(GRAY).font('Helvetica').fontSize(10)
}

function bullet(text, indent = 60, color = GRAY) {
  const x = doc.x
  doc.fillColor(accent => color)
  doc.rect(indent - 14, doc.y + 4, 5, 5).fill(INDIGO)
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text(text, indent, doc.y, { width: doc.page.width - indent - 50 })
}

function tableRow(cols, widths, isHeader = false, y = null) {
  const startX = 50
  let x = startX
  const rowH = 20
  const startY = y || doc.y

  if (isHeader) {
    doc.rect(startX, startY, widths.reduce((a, b) => a + b, 0), rowH).fill(INDIGO)
    doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
  } else {
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
  }

  cols.forEach((col, i) => {
    doc.text(col, x + 4, startY + 6, { width: widths[i] - 8, lineBreak: false })
    x += widths[i]
  })

  if (!isHeader) {
    x = startX
    cols.forEach((_, i) => {
      doc.rect(x, startY, widths[i], rowH).stroke('#E5E7EB')
      x += widths[i]
    })
  }
  doc.y = startY + rowH + 2
  doc.fillColor(GRAY).font('Helvetica').fontSize(10)
}

function infoBox(text, color = '#EEF2FF', borderColor = INDIGO) {
  const w = doc.page.width - 100
  const h = 30
  doc.rect(50, doc.y, w, h).fill(color)
  doc.rect(50, doc.y, 4, h).fill(borderColor)
  doc.fillColor(GRAY).fontSize(9).font('Helvetica')
     .text(text, 62, doc.y + 8, { width: w - 20 })
  doc.y += h + 6
}

function codeBlock(lines) {
  const w = doc.page.width - 100
  const lineH = 14
  const h = lines.length * lineH + 16
  doc.rect(50, doc.y, w, h).fill('#1F2937')
  doc.fillColor('#D1FAE5').fontSize(8.5).font('Courier')
  lines.forEach((line, i) => {
    doc.text(line, 62, doc.y - h + 8 + i * lineH + (i === 0 ? 0 : 0), { lineBreak: false })
  })
  doc.y += 8
  doc.fillColor(GRAY).font('Helvetica').fontSize(10)
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ═══════════════════════════════════════════════════════════════
newSlide('College Academic Management Portal', INDIGO)
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#EEF2FF')
doc.rect(0, 0, doc.page.width, 120).fill(INDIGO)
doc.fillColor(WHITE).fontSize(22).font('Helvetica-Bold')
   .text('College Academic Management Portal', 50, 30, { align: 'center' })
doc.fontSize(13).font('Helvetica')
   .text('A Full-Stack Web Application for Academic Management', 50, 65, { align: 'center' })

doc.y = 140
doc.fillColor(INDIGO).fontSize(14).font('Helvetica-Bold').text('Tech Stack', { align: 'center' })
doc.moveDown(0.4)

const techItems = ['MongoDB', 'Express.js', 'React.js', 'Node.js']
const techColors = ['#059669','#D97706','#2563EB','#4F46E5']
let tx = 80
techItems.forEach((t, i) => {
  doc.rect(tx, doc.y, 90, 36).fill(techColors[i])
  doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
     .text(t, tx, doc.y + 12, { width: 90, align: 'center' })
  tx += 100
})
doc.y += 54

doc.fillColor(GRAY).fontSize(11).font('Helvetica').moveDown(0.8)
   .text('Role-Based Portal  ·  REST API  ·  JWT Auth  ·  OTP Reset  ·  File Uploads', { align: 'center' })

doc.moveDown(1)
doc.fillColor(GRAY).fontSize(10)
   .text('Major Project  |  Full-Stack Development', { align: 'center' })

// ═══════════════════════════════════════════════════════════════
// SLIDE 2 — PROBLEM STATEMENT
// ═══════════════════════════════════════════════════════════════
newSlide('Problem Statement', RED)

sectionHeader('Problems in Traditional College Systems:', RED)
const problems = [
  'Attendance maintained in physical registers — prone to errors, loss, and manipulation',
  'Mark sheets calculated manually — time-consuming and error-prone',
  'Study materials distributed via WhatsApp/USB — completely unorganized',
  'Students only discover attendance shortage just before exams',
  'No centralized platform — faculty and students use different tools',
  'No digital trail for previous year question papers',
  'No role-based access — anyone can see everything',
  'No secure password management for students',
]
doc.y += 4
problems.forEach(p => {
  doc.rect(46, doc.y + 3, 6, 6).fill(RED)
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text(p, 62, doc.y, { width: doc.page.width - 110 })
  doc.moveDown(0.35)
})

doc.moveDown(0.5)
sectionHeader('Impact:', ORANGE)
const impacts = [
  'Students detained from exams due to low attendance (discovered too late)',
  'Faculty spends hours calculating marks percentages manually',
  'Important study materials lost or not accessible to all students',
  'No accountability or audit trail for attendance records',
]
impacts.forEach(p => {
  doc.rect(46, doc.y + 3, 6, 6).fill(ORANGE)
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text(p, 62, doc.y, { width: doc.page.width - 110 })
  doc.moveDown(0.35)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 3 — OBJECTIVES
// ═══════════════════════════════════════════════════════════════
newSlide('Project Objectives', GREEN)

const objectives = [
  ['1.', 'Build a centralized digital portal for all academic management activities'],
  ['2.', 'Provide real-time attendance tracking with automatic shortage alerts (< 75%)'],
  ['3.', 'Enable secure digital distribution and download of study materials'],
  ['4.', 'Implement strict role-based access — Admin and Student roles'],
  ['5.', 'Allow bulk attendance and marks entry to save faculty time'],
  ['6.', 'Dashboard analytics for quick academic overview'],
  ['7.', 'Secure authentication with OTP-based email password reset'],
  ['8.', 'Mobile-responsive design accessible on all devices'],
  ['9.', 'Support all types of study materials — Notes, Papers, Assignments'],
  ['10.', 'Maintain historical data — previous year papers always available'],
]

doc.y += 4
objectives.forEach(([num, text]) => {
  doc.fillColor(GREEN).fontSize(11).font('Helvetica-Bold').text(num, 50, doc.y, { width: 25, lineBreak: false })
  doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(text, 76, doc.y, { width: doc.page.width - 120 })
  doc.moveDown(0.45)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 4 — TECH STACK
// ═══════════════════════════════════════════════════════════════
newSlide('Tech Stack Details', INDIGO)

sectionHeader('Frontend Technologies', BLUE)
tableRow(['Technology', 'Version', 'Purpose'], [130, 80, 280], true)
;[
  ['React.js', '18.3', 'UI Framework — Component-based architecture'],
  ['Vite', '5.4', 'Build Tool & Dev Server — Extremely fast HMR'],
  ['Tailwind CSS', '3.4', 'Utility-first CSS framework for styling'],
  ['React Router', 'v6', 'Client-side routing & protected routes'],
  ['Axios', '1.7', 'HTTP client for all API calls'],
  ['React Hot Toast', '2.4', 'Beautiful toast notifications'],
  ['Heroicons', '2.1', 'SVG icon library'],
  ['date-fns', '3.6', 'Date formatting utilities'],
].forEach(r => tableRow(r, [130, 80, 280]))

doc.moveDown(0.5)
sectionHeader('Backend Technologies', PURPLE)
tableRow(['Technology', 'Version', 'Purpose'], [130, 80, 280], true)
;[
  ['Node.js', 'v24', 'JavaScript runtime environment'],
  ['Express.js', '4.19', 'Web framework for REST API'],
  ['MongoDB', '8.2', 'NoSQL database (local Windows service)'],
  ['Mongoose', '8.6', 'ODM for MongoDB'],
  ['JWT', '9.0', 'Stateless authentication tokens (24h)'],
  ['Bcryptjs', '2.4', 'Password hashing (10 salt rounds)'],
  ['Multer', '1.4', 'Multipart file upload handler'],
  ['Nodemailer', '6.9', 'Email sending for OTP via Gmail SMTP'],
  ['Helmet', '7.1', 'Security HTTP headers middleware'],
  ['mongoose-paginate-v2', '1.8', 'Built-in pagination for all listings'],
].forEach(r => tableRow(r, [130, 80, 280]))

// ═══════════════════════════════════════════════════════════════
// SLIDE 5 — DATABASE DESIGN
// ═══════════════════════════════════════════════════════════════
newSlide('Database Design — 7 Collections', PURPLE)

const collections = [
  {
    name: '1. Users',
    fields: 'name, email, password (bcrypt hashed), role (ADMIN/STUDENT), isActive, timestamps',
  },
  {
    name: '2. Students',
    fields: 'userId → User, enrollmentNumber (unique), fullName, email, phone, branch, semester, section, academicYear, status (ACTIVE/INACTIVE)',
  },
  {
    name: '3. Subjects',
    fields: 'subjectCode (unique), subjectName, semester, branch, academicYear, description, isActive',
  },
  {
    name: '4. Attendance',
    fields: 'student → Student, subject → Subject, date, status (PRESENT/ABSENT) | Unique Index: {student + subject + date}',
  },
  {
    name: '5. Marks',
    fields: 'student → Student, subject → Subject, examType (MST_1/2/3, UNIT_TEST_1/2/3), obtainedMarks, maximumMarks, remarks | Unique Index: {student + subject + examType}',
  },
  {
    name: '6. Study Materials',
    fields: 'title, subject → Subject, materialType (NOTES/ASSIGNMENT/MST_PAPER/UNIT_TEST_PAPER/UNIVERSITY_PAPER), fileName, filePath, fileSize, uploadedBy → User',
  },
  {
    name: '7. OTPs',
    fields: 'student → Student, otpHash (bcrypt), expiresAt (5 min), attempts (max 3), isUsed, lastSentAt (60s cooldown) | TTL auto-delete: 10 min',
  },
]

collections.forEach(c => {
  doc.fillColor(PURPLE).fontSize(10).font('Helvetica-Bold').text(c.name)
  doc.rect(50, doc.y, doc.page.width - 100, 22).fill('#F5F3FF')
  doc.fillColor(GRAY).fontSize(8.5).font('Courier')
     .text(c.fields, 56, doc.y + 6, { width: doc.page.width - 110 })
  doc.y += 26
  doc.moveDown(0.2)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 6 — SYSTEM ARCHITECTURE
// ═══════════════════════════════════════════════════════════════
newSlide('System Architecture — 3-Tier', BLUE)

sectionHeader('Architecture Overview', BLUE)
infoBox('3-Tier Architecture: Presentation → Business Logic → Data', '#EFF6FF', BLUE)

const archItems = [
  { tier: 'TIER 1 — Frontend', detail: 'React 18 + Vite + Tailwind CSS | Port: 5173', color: BLUE },
  { tier: '  ↕  Communication', detail: 'REST API over HTTP | Axios with Bearer JWT Token | Vite Proxy', color: GRAY },
  { tier: 'TIER 2 — Backend', detail: 'Node.js + Express.js REST API | Port: 5000', color: INDIGO },
  { tier: '  → Routes', detail: '/api/auth  /api/students  /api/subjects  /api/attendance  /api/marks  /api/materials  /api/dashboard', color: GRAY },
  { tier: '  → Middleware', detail: 'JWT Auth · CORS · Helmet · Rate Limit · Multer · Express Validator', color: GRAY },
  { tier: '  → Controllers', detail: 'authCtrl · studentCtrl · subjectCtrl · attendanceCtrl · marksCtrl · materialCtrl · dashboardCtrl', color: GRAY },
  { tier: '  ↕  Communication', detail: 'Mongoose ODM | Connection Pooling | Schema Validation', color: GRAY },
  { tier: 'TIER 3 — Database', detail: 'MongoDB 8.2 | Port: 27017 | 7 Collections | TTL Indexes | Compound Unique Indexes', color: GREEN },
]

archItems.forEach(item => {
  doc.fillColor(item.color).fontSize(item.tier.startsWith('  ') ? 9 : 10)
     .font(item.tier.startsWith('  ') ? 'Helvetica' : 'Helvetica-Bold')
     .text(item.tier, 50, doc.y, { width: 140, lineBreak: false, continued: false })
  const prevY = doc.y - 12
  doc.fillColor(GRAY).fontSize(9).font('Helvetica')
     .text(item.detail, 200, prevY, { width: doc.page.width - 250 })
  doc.moveDown(0.1)
})

doc.moveDown(0.5)
sectionHeader('Key Design Decisions', INDIGO)
const decisions = [
  'JWT stateless auth — no server-side sessions needed',
  'mongoose-paginate-v2 — consistent pagination across all list APIs',
  'Compound unique indexes on Attendance & Marks — no duplicates possible at DB level',
  'MongoDB TTL index on OTPs — auto-cleanup without cron jobs',
  'Multer disk storage with UUID filenames — prevents file collisions',
  'Soft delete pattern — data preserved for historical records',
]
decisions.forEach(d => {
  doc.rect(46, doc.y + 3, 5, 5).fill(INDIGO)
  doc.fillColor(GRAY).fontSize(9.5).font('Helvetica')
     .text(d, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.3)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 7 — ADMIN FEATURES
// ═══════════════════════════════════════════════════════════════
newSlide('Admin Features (15)', PURPLE)

const adminFeatures = [
  ['1', 'Admin Login', 'Email + Password → JWT token generation'],
  ['2', 'Admin Dashboard', 'Stats: students, subjects, attendance, materials, avg %'],
  ['3', 'Add Student', 'Creates User + Student records with enrollment number'],
  ['4', 'Edit Student', 'Update all details except enrollment number'],
  ['5', 'Deactivate Student', 'Soft delete — Student status=INACTIVE, User isActive=false'],
  ['6', 'Student Detail View', '3 tabs: Attendance Summary, Daily Records, Marks'],
  ['7', 'Add Subject', 'subjectCode (unique), name, branch, semester, year'],
  ['8', 'Edit / Deactivate Subject', 'Soft delete preserves historical attendance/marks'],
  ['9', 'Mark Attendance', 'Select date + subject → load all students → toggle status'],
  ['10', 'Bulk Attendance Save', 'Upsert — if record exists it updates, else creates'],
  ['11', 'Edit Attendance', 'Inline toggle PRESENT ↔ ABSENT in view tab'],
  ['12', 'Add / Bulk Marks', 'Select subject + exam type → enter marks for all students'],
  ['13', 'Edit / Delete Marks', 'Individual record management'],
  ['14', 'Upload Materials', 'Title, Subject, Type, File (PDF/DOC/PPT etc.) → stored on server'],
  ['15', 'Change Password', 'Requires current password verification'],
]

tableRow(['#', 'Feature', 'Description'], [25, 130, 325], true)
adminFeatures.forEach(r => tableRow(r, [25, 130, 325]))

// ═══════════════════════════════════════════════════════════════
// SLIDE 8 — STUDENT FEATURES
// ═══════════════════════════════════════════════════════════════
newSlide('Student Features (12)', INDIGO)

const studentFeatures = [
  ['1', 'Student Login', 'Enrollment Number + Password → JWT with studentId'],
  ['2', 'Student Dashboard', 'Attendance %, marks summary, today\'s status, recent materials'],
  ['3', 'Attendance Warning', 'Auto-shows orange banner if overall attendance < 75%'],
  ['4', 'Attendance Summary', 'Subject-wise: Total / Present / Absent / % (color-coded)'],
  ['5', 'Daily Attendance', 'Filter by date, subject, status — paginated records'],
  ['6', 'View Marks', 'Grouped by subject: Exam Type / Obtained / Max / %'],
  ['7', 'View Materials', 'Grid view with subject, type badge, upload date, size'],
  ['8', 'Download Materials', 'Direct download with original filename'],
  ['9', 'Filter Materials', 'Search by title, filter by subject and material type'],
  ['10', 'View Profile', 'Personal info: name, enrollment, branch, sem, email, phone'],
  ['11', 'Change Password', 'Current password verification required'],
  ['12', 'Forgot Password', '3-step OTP wizard — enrollment → OTP email → new password'],
]

tableRow(['#', 'Feature', 'Description'], [25, 130, 325], true)
studentFeatures.forEach(r => tableRow(r, [25, 130, 325]))

// ═══════════════════════════════════════════════════════════════
// SLIDE 9 — AUTH & SECURITY
// ═══════════════════════════════════════════════════════════════
newSlide('Authentication & Security', RED)

sectionHeader('Student Login Flow', BLUE)
const studentFlow = [
  'Enter Enrollment Number + Password on Login page',
  'POST /api/auth/login with { username, password, role: "STUDENT" }',
  'Backend: Find Student by enrollmentNumber (case-insensitive)',
  'Get student.userId → Find User document',
  'BCrypt compare password (10 salt rounds)',
  'Check isActive=true (account not deactivated)',
  'Generate JWT: { id, name, email, role, studentId } — expires 24h',
  'Frontend stores token in localStorage → redirects to /student/dashboard',
]
studentFlow.forEach((s, i) => {
  doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text(`${i + 1}.`, 50, doc.y, { width: 18, lineBreak: false })
  doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(s, 68, doc.y, { width: doc.page.width - 118 })
  doc.moveDown(0.25)
})

doc.moveDown(0.3)
sectionHeader('Security Measures', RED)
const security = [
  ['JWT Authentication', '24-hour token expiry — stateless, no server sessions'],
  ['BCrypt Hashing', '10 salt rounds — industry standard password security'],
  ['OTP Security', 'BCrypt hashed OTP, 5 min expiry, max 3 attempts, 60s cooldown'],
  ['Helmet.js', 'Sets 11 security HTTP headers (XSS, CSP, HSTS etc.)'],
  ['Rate Limiting', 'Prevents brute-force attacks on login/OTP endpoints'],
  ['Role Authorization', 'Backend middleware — students blocked from admin APIs (403)'],
  ['CORS Policy', 'Only allows requests from http://localhost:5173'],
  ['Input Validation', 'Express Validator on all POST/PUT endpoints'],
]
tableRow(['Security', 'Implementation'], [150, 330], true)
security.forEach(r => tableRow(r, [150, 330]))

// ═══════════════════════════════════════════════════════════════
// SLIDE 10 — OTP FLOW
// ═══════════════════════════════════════════════════════════════
newSlide('OTP Password Reset — 3 Step Flow', ORANGE)

sectionHeader('Step 1 — Request OTP', ORANGE)
const step1 = [
  'Student enters Enrollment Number on Forgot Password page',
  'POST /api/auth/forgot-password { enrollmentNumber }',
  'System finds Student by enrollment number',
  'Check cooldown: if OTP sent within 60 seconds → reject (429)',
  'Generate random 6-digit OTP (Math.random)',
  'Hash OTP with BCrypt (10 rounds) → save to OTP collection',
  'Send HTML email via Nodemailer (Gmail SMTP) with OTP in big styled box',
  'OTP expires in 5 minutes | Auto-deleted by MongoDB TTL after 10 minutes',
]
step1.forEach(s => {
  doc.rect(46, doc.y + 3, 5, 5).fill(ORANGE)
  doc.fillColor(GRAY).fontSize(9.5).font('Helvetica').text(s, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.28)
})

doc.moveDown(0.3)
sectionHeader('Step 2 — Verify OTP', GREEN)
const step2 = [
  'Student enters 6-digit OTP received in email',
  'POST /api/auth/verify-otp { enrollmentNumber, otp }',
  'Find OTP record → check isUsed=false, expiresAt > now',
  'Increment attempts counter (max 3 wrong → blocked)',
  'BCrypt compare entered OTP with stored hash',
  'If match → return { verified: true } → proceed to Step 3',
]
step2.forEach(s => {
  doc.rect(46, doc.y + 3, 5, 5).fill(GREEN)
  doc.fillColor(GRAY).fontSize(9.5).font('Helvetica').text(s, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.28)
})

doc.moveDown(0.3)
sectionHeader('Step 3 — Reset Password', BLUE)
const step3 = [
  'Student enters New Password + Confirm Password (min 8 chars)',
  'POST /api/auth/reset-password { enrollmentNumber, otp, newPassword, confirmPassword }',
  'OTP verified AGAIN for security (prevents skipping Step 2)',
  'Find Student → get userId → find User',
  'Update User.password — BCrypt pre-save hook auto-hashes it',
  'Mark OTP as isUsed=true → cannot be reused',
  'Return success → frontend redirects to /login',
]
step3.forEach(s => {
  doc.rect(46, doc.y + 3, 5, 5).fill(BLUE)
  doc.fillColor(GRAY).fontSize(9.5).font('Helvetica').text(s, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.28)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 11 — API ENDPOINTS
// ═══════════════════════════════════════════════════════════════
newSlide('REST API Endpoints (30+)', INDIGO)

const apiSections = [
  {
    title: 'Auth Endpoints', color: RED,
    rows: [
      ['POST', '/api/auth/login', 'All', 'Student/Admin login → JWT token'],
      ['POST', '/api/auth/forgot-password', 'Public', 'Send OTP to student email'],
      ['POST', '/api/auth/verify-otp', 'Public', 'Verify 6-digit OTP'],
      ['POST', '/api/auth/reset-password', 'Public', 'Reset password with OTP'],
      ['POST', '/api/auth/change-password', 'Auth', 'Change password (current required)'],
    ]
  },
  {
    title: 'Student Endpoints', color: BLUE,
    rows: [
      ['GET', '/api/students/me', 'Student', 'Own profile'],
      ['GET', '/api/students', 'Admin', 'All students (paginated, filtered)'],
      ['POST', '/api/students', 'Admin', 'Create student + user account'],
      ['PUT', '/api/students/:id', 'Admin', 'Update student details'],
      ['DELETE', '/api/students/:id', 'Admin', 'Soft deactivate'],
    ]
  },
  {
    title: 'Attendance Endpoints', color: GREEN,
    rows: [
      ['GET', '/api/attendance/my', 'Student', 'Own subject-wise summary'],
      ['GET', '/api/attendance/my/daily', 'Student', 'Daily records (filtered)'],
      ['GET', '/api/attendance/session', 'Admin', 'Load students for a session'],
      ['POST', '/api/attendance/bulk', 'Admin', 'Bulk save/upsert attendance'],
      ['PUT', '/api/attendance/:id', 'Admin', 'Edit single record'],
      ['GET', '/api/attendance/below75', 'Admin', 'Students with < 75%'],
    ]
  },
  {
    title: 'Marks / Materials / Dashboard', color: PURPLE,
    rows: [
      ['GET', '/api/marks/my', 'Student', 'Own marks grouped by subject'],
      ['POST', '/api/marks/bulk', 'Admin', 'Bulk add/upsert marks'],
      ['DELETE', '/api/marks/:id', 'Admin', 'Delete mark record'],
      ['GET', '/api/materials', 'Auth', 'List materials (filtered)'],
      ['POST', '/api/materials', 'Admin', 'Upload file + metadata'],
      ['GET', '/api/materials/:id/download', 'Auth', 'Download file'],
      ['GET', '/api/dashboard/student', 'Student', 'Complete student dashboard'],
      ['GET', '/api/dashboard/admin', 'Admin', 'Complete admin dashboard'],
    ]
  },
]

apiSections.forEach(sec => {
  sectionHeader(sec.title, sec.color)
  tableRow(['Method', 'Endpoint', 'Access', 'Description'], [45, 165, 55, 215], true)
  sec.rows.forEach(r => tableRow(r, [45, 165, 55, 215]))
  doc.moveDown(0.3)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 12 — ATTENDANCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
newSlide('Attendance Management', GREEN)

sectionHeader('Admin — Mark Attendance (Step by Step)', INDIGO)
const markSteps = [
  'Select Date (default: today) and Subject from dropdown',
  'Click "Load Students" → GET /api/attendance/session?subjectId=&date=',
  'Backend fetches all ACTIVE students for the subject',
  'If attendance already marked for this session, it pre-loads existing status',
  'Student rows show color-coded: Green row = PRESENT, Red row = ABSENT',
  'Click any student\'s button to toggle PRESENT ↔ ABSENT',
  'Use "Mark All Present" or "Mark All Absent" for quick batch action',
  'Live counter shows: X Present · Y Absent · Total Z',
  'Click "Save Attendance" → POST /api/attendance/bulk',
  'Backend uses upsert (findOneAndUpdate) — safe to save multiple times',
]
markSteps.forEach((s, i) => {
  doc.fillColor(INDIGO).font('Helvetica-Bold').fontSize(9).text(`${i + 1}.`, 50, doc.y, { width: 20, lineBreak: false })
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(s, 70, doc.y, { width: doc.page.width - 120 })
  doc.moveDown(0.3)
})

doc.moveDown(0.3)
sectionHeader('Student — View Attendance', BLUE)
const viewItems = [
  'Summary Tab: Overall % shown in large color-coded circle (green/yellow/red)',
  'Subject-wise table: Subject Name | Code | Total | Present | Absent | %',
  'Percentage badge colors: ≥75% = Green, 60-74% = Yellow, <60% = Red',
  'Orange warning banner auto-appears if overall attendance < 75%',
  'Daily Tab: Filter by Date, Subject (dropdown), Status (All/Present/Absent)',
  'Results show: Date | Subject | Subject Code | Status badge',
  'Paginated — 10 records per page with Prev/Next navigation',
]
viewItems.forEach(s => {
  doc.rect(46, doc.y + 3, 5, 5).fill(BLUE)
  doc.fillColor(GRAY).font('Helvetica').fontSize(9.5).text(s, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.3)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 13 — MARKS MANAGEMENT
// ═══════════════════════════════════════════════════════════════
newSlide('Marks Management', PURPLE)

sectionHeader('Exam Types Supported (6)', PURPLE)
tableRow(['Exam Type', 'Full Form', 'Typical Max Marks'], [120, 200, 160], true)
;[
  ['MST_1', 'Mid Semester Test 1', '20-40 marks'],
  ['MST_2', 'Mid Semester Test 2', '20-40 marks'],
  ['MST_3', 'Mid Semester Test 3', '20-40 marks'],
  ['UNIT_TEST_1', 'Unit Test 1', '10-20 marks'],
  ['UNIT_TEST_2', 'Unit Test 2', '10-20 marks'],
  ['UNIT_TEST_3', 'Unit Test 3', '10-20 marks'],
].forEach(r => tableRow(r, [120, 200, 160]))

doc.moveDown(0.5)
sectionHeader('Admin — Add Bulk Marks', INDIGO)
const bulkMarksSteps = [
  'Select Subject and Exam Type from dropdowns',
  'Click "Load Students" → fetches all active students',
  'For each student: enter Obtained Marks and Maximum Marks (default 40)',
  'Validation: obtained marks cannot exceed maximum marks',
  'Click "Save All Marks" → POST /api/marks/bulk',
  'Backend uses upsert per {student, subject, examType} — no duplicates',
  'Success toast shown with count of records saved',
]
bulkMarksSteps.forEach((s, i) => {
  doc.fillColor(INDIGO).font('Helvetica-Bold').fontSize(9).text(`${i + 1}.`, 50, doc.y, { width: 20, lineBreak: false })
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(s, 70, doc.y, { width: doc.page.width - 120 })
  doc.moveDown(0.3)
})

doc.moveDown(0.3)
sectionHeader('Student — View Marks', GREEN)
const studentMarks = [
  'Marks grouped by Subject — each subject is a separate card',
  'Shows: Average % for the subject in top-right corner',
  'Table: Exam Type | Obtained | Maximum | Percentage',
  'Color-coded: ≥75% Green · ≥50% Yellow · <50% Red',
  'Remarks column shown if admin has added any remarks',
]
studentMarks.forEach(s => {
  doc.rect(46, doc.y + 3, 5, 5).fill(GREEN)
  doc.fillColor(GRAY).font('Helvetica').fontSize(9.5).text(s, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.3)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 14 — STUDY MATERIALS
// ═══════════════════════════════════════════════════════════════
newSlide('Study Materials Module', BLUE)

sectionHeader('Material Types (5)', BLUE)
tableRow(['Type', 'Badge Color', 'Purpose'], [130, 100, 250], true)
;[
  ['NOTES', 'Blue', 'Lecture notes shared by faculty'],
  ['ASSIGNMENT', 'Purple', 'Assignments with instructions'],
  ['MST_PAPER', 'Yellow', 'Previous Mid-Semester Test papers'],
  ['UNIT_TEST_PAPER', 'Green', 'Previous Unit Test papers'],
  ['UNIVERSITY_PAPER', 'Red', 'Previous University/Board exam papers'],
].forEach(r => tableRow(r, [130, 100, 250]))

doc.moveDown(0.4)
sectionHeader('Supported File Formats', INDIGO)
infoBox('PDF · DOC · DOCX · PPT · PPTX · XLS · XLSX · JPG · JPEG · PNG  (Max: 10 MB)', '#EFF6FF', BLUE)

doc.moveDown(0.3)
sectionHeader('Admin — Upload Flow', PURPLE)
const uploadFlow = [
  'Click "Upload Material" → modal opens',
  'Fill: Title (required), Description (optional)',
  'Select Subject from dropdown, Material Type, Semester, Academic Year',
  'Choose file from system (max 10 MB, validated types only)',
  'Submit → POST /api/materials (multipart/form-data)',
  'Multer saves file with UUID filename (e.g., 9f3a2b1c-...pdf)',
  'DB record stores: original filename, UUID filepath, fileSize',
  'File appears in grid immediately after upload',
]
uploadFlow.forEach((s, i) => {
  doc.fillColor(PURPLE).font('Helvetica-Bold').fontSize(9).text(`${i + 1}.`, 50, doc.y, { width: 20, lineBreak: false })
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(s, 70, doc.y, { width: doc.page.width - 120 })
  doc.moveDown(0.3)
})

doc.moveDown(0.3)
sectionHeader('Student — Download Flow', GREEN)
const dlFlow = [
  'Browse materials with filters (Subject, Type, Search title)',
  'Material card shows: Title, Subject, Type badge, Description, Upload date, File size',
  'Click "Download" → GET /api/materials/:id/download',
  'Backend: resolves file path → streams file with original filename in Content-Disposition header',
  'Browser prompts download with original filename (not UUID)',
]
dlFlow.forEach(s => {
  doc.rect(46, doc.y + 3, 5, 5).fill(GREEN)
  doc.fillColor(GRAY).font('Helvetica').fontSize(9.5).text(s, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.3)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 15 — FRONTEND PAGES
// ═══════════════════════════════════════════════════════════════
newSlide('Frontend — 18 Pages + 7 Components', INDIGO)

sectionHeader('Page Structure', INDIGO)
const pages = [
  ['PUBLIC', '/login', 'Login page with Student + Admin tabs, show/hide password'],
  ['PUBLIC', '/forgot-password', '3-step OTP wizard with countdown timer'],
  ['STUDENT', '/student/dashboard', 'Stats, attendance summary, marks, materials overview'],
  ['STUDENT', '/student/attendance', 'Summary tab (circle %) + Daily tab (filtered table)'],
  ['STUDENT', '/student/marks', 'Subject-grouped cards with exam marks table'],
  ['STUDENT', '/student/materials', 'Material grid with filters + download buttons'],
  ['STUDENT', '/student/profile', 'Read-only personal & academic info display'],
  ['STUDENT', '/student/change-password', 'Password change form with show/hide toggle'],
  ['ADMIN', '/admin/dashboard', 'Analytics stats + quick actions + alerts'],
  ['ADMIN', '/admin/students', 'CRUD with search/filter + add/edit modal + deactivate'],
  ['ADMIN', '/admin/students/:id', 'Student detail with 3 tabs'],
  ['ADMIN', '/admin/subjects', 'CRUD with search/filter + modal'],
  ['ADMIN', '/admin/attendance', 'Mark tab + View/Edit tab'],
  ['ADMIN', '/admin/marks', 'Bulk add tab + View/Edit/Delete tab'],
  ['ADMIN', '/admin/materials', 'Upload modal + material grid + delete'],
  ['ADMIN', '/admin/profile', 'Admin profile info from JWT context'],
  ['ADMIN', '/admin/change-password', 'Admin password change'],
]
tableRow(['Role', 'Route', 'Description'], [65, 145, 270], true)
pages.forEach(r => tableRow(r, [65, 145, 270]))

doc.moveDown(0.4)
sectionHeader('Reusable Components (7)', PURPLE)
tableRow(['Component', 'Description'], [150, 330], true)
;[
  ['LoadingSpinner', 'Animated spinner shown during API calls'],
  ['SearchInput', 'Debounced (400ms) search box — no infinite re-render (ref pattern)'],
  ['Pagination', 'Prev/Next + numbered pages — hides if only 1 page'],
  ['ConfirmDialog', 'Delete confirmation modal — closes on ESC key or backdrop click'],
  ['AttendanceWarningBanner', 'Orange alert banner — auto-shows only when attendance < 75%'],
  ['StatCard', 'Dashboard cards — icon + value + subtitle + color variants'],
  ['EmptyState', 'Friendly "no data" placeholder with optional action button'],
].forEach(r => tableRow(r, [150, 330]))

// ═══════════════════════════════════════════════════════════════
// SLIDE 16 — SEED DATA / DEMO
// ═══════════════════════════════════════════════════════════════
newSlide('Demo / Seed Data (Auto-loaded)', GREEN)

sectionHeader('Admin Account', PURPLE)
tableRow(['Field', 'Value'], [120, 360], true)
;[
  ['Name', 'System Administrator'],
  ['Email', 'admin@college.edu'],
  ['Password', 'Admin@123'],
  ['Role', 'ADMIN'],
].forEach(r => tableRow(r, [120, 360]))

doc.moveDown(0.5)
sectionHeader('Student Accounts (3)', BLUE)
tableRow(['Name', 'Enrollment No.', 'Password', 'Branch/Sem'], [130, 110, 90, 150], true)
;[
  ['Rahul Sharma', '2301234567', 'Student@123', 'CSE — Semester 5'],
  ['Priya Singh', '2301234568', 'Student@123', 'CSE — Semester 5'],
  ['Amit Kumar', '2301234569', 'Student@123', 'CSE — Semester 5'],
].forEach(r => tableRow(r, [130, 110, 90, 150]))

doc.moveDown(0.5)
sectionHeader('Subjects (6) — CSE Semester 5', INDIGO)
tableRow(['Subject Code', 'Subject Name'], [120, 360], true)
;[
  ['CS501', 'Java Programming'],
  ['CS502', 'Database Management Systems'],
  ['CS503', 'Computer Networks'],
  ['CS504', 'Operating Systems'],
  ['CS505', 'Software Engineering'],
  ['CS506', 'Artificial Intelligence'],
].forEach(r => tableRow(r, [120, 360]))

doc.moveDown(0.5)
sectionHeader('Auto-generated Demo Data', GREEN)
const autoData = [
  'Last 10 days attendance for all 3 students × 6 subjects (~80% present rate = random)',
  'MST_1 marks for all 3 students × 6 subjects (random range: 12-20 out of 20)',
  'UNIT_TEST_1 marks for all 3 students × 6 subjects (random range: 7-10 out of 10)',
]
autoData.forEach(s => {
  doc.rect(46, doc.y + 3, 5, 5).fill(GREEN)
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(s, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.35)
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 17 — HOW TO RUN
// ═══════════════════════════════════════════════════════════════
newSlide('How to Run the Project', GRAY)

sectionHeader('Requirements', INDIGO)
const reqs = ['Node.js v18 or higher', 'MongoDB (local or Atlas)', 'npm (comes with Node.js)', 'Gmail account with App Password (for OTP email only)']
reqs.forEach(r => {
  doc.rect(46, doc.y + 3, 5, 5).fill(INDIGO)
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(r, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.3)
})

doc.moveDown(0.3)
sectionHeader('Step 1 — Start Backend', GREEN)
infoBox('cd "d:\\Major Project\\backend"  then  node server.js  →  Runs on http://localhost:5000', '#F0FDF4', GREEN)
doc.fillColor(GRAY).fontSize(9).font('Helvetica')
   .text('MongoDB auto-connects · Seed data auto-loads on first run · All APIs ready', 50, doc.y)
doc.moveDown(0.5)

sectionHeader('Step 2 — Start Frontend', BLUE)
infoBox('cd "d:\\Major Project\\frontend"  then  npm run dev  →  Runs on http://localhost:5173', '#EFF6FF', BLUE)
doc.moveDown(0.3)

sectionHeader('Step 3 — Open Browser', INDIGO)
infoBox('Open: http://localhost:5173', '#EEF2FF', INDIGO)
doc.moveDown(0.3)

sectionHeader('Environment Variables (backend/.env)', ORANGE)
const envVars = [
  'PORT=5000',
  'MONGODB_URI=mongodb://localhost:27017/college_portal',
  'JWT_SECRET=your_very_long_secret_key_here',
  'JWT_EXPIRE=24h',
  'MAIL_HOST=smtp.gmail.com',
  'MAIL_PORT=587',
  'MAIL_USER=your@gmail.com',
  'MAIL_PASS=your-gmail-app-password',
]
doc.rect(50, doc.y, doc.page.width - 100, envVars.length * 14 + 16).fill('#1F2937')
doc.fillColor('#D1FAE5').fontSize(8.5).font('Courier')
envVars.forEach((line, i) => {
  doc.text(line, 62, doc.y - (envVars.length * 14 + 16) + 8 + i * 14)
})
doc.y += 10

// ═══════════════════════════════════════════════════════════════
// SLIDE 18 — FUTURE SCOPE
// ═══════════════════════════════════════════════════════════════
newSlide('Future Scope', PURPLE)

const futureItems = [
  { icon: '📱', title: 'Mobile Application', desc: 'React Native app for Android & iOS — same backend API' },
  { icon: '📊', title: 'Charts & Analytics', desc: 'Recharts/Chart.js — attendance trend graphs, marks bar charts' },
  { icon: '🔔', title: 'Push Notifications', desc: 'Browser notifications for attendance shortage alerts' },
  { icon: '📅', title: 'Timetable Module', desc: 'Weekly class schedule management for all subjects' },
  { icon: '💳', title: 'Fee Management', desc: 'Fee records, payment status, and downloadable receipts' },
  { icon: '📝', title: 'Online Assignments', desc: 'Students submit assignments online, admin grades them' },
  { icon: '📱', title: 'SMS Alerts', desc: 'Parent notifications via SMS gateway (Twilio/MSG91)' },
  { icon: '☁️', title: 'Cloud Deployment', desc: 'AWS/Render for backend + Vercel for frontend + MongoDB Atlas' },
  { icon: '🎓', title: 'Result Module', desc: 'Semester result publication with grade calculation' },
  { icon: '🔗', title: 'ERP Integration', desc: 'API bridge with university ERP systems for data sync' },
]

futureItems.forEach((item, i) => {
  const y = doc.y
  doc.rect(50, y, doc.page.width - 100, 30).fill(i % 2 === 0 ? '#F5F3FF' : '#EEF2FF')
  doc.fillColor(PURPLE).fontSize(12).text(item.icon, 58, y + 8, { width: 25, lineBreak: false })
  doc.fillColor(INDIGO).font('Helvetica-Bold').fontSize(9.5).text(item.title, 84, y + 4, { width: 140, lineBreak: false })
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(item.desc, 230, y + 4, { width: doc.page.width - 280 })
  doc.y = y + 34
})

// ═══════════════════════════════════════════════════════════════
// SLIDE 19 — CONCLUSION
// ═══════════════════════════════════════════════════════════════
newSlide('Conclusion', INDIGO)

sectionHeader('What We Accomplished', GREEN)
const achievements = [
  '✅  18 fully functional pages — zero placeholder buttons, zero dummy APIs',
  '✅  30+ REST API endpoints with proper authentication and authorization',
  '✅  7 MongoDB collections with proper relationships and indexes',
  '✅  Role-based access control enforced at backend middleware level',
  '✅  Secure JWT authentication + BCrypt + OTP email password reset',
  '✅  Bulk attendance marking — 60 students in < 2 minutes',
  '✅  File upload & download system for 9 file formats',
  '✅  Mobile-responsive design — works on phone, tablet, desktop',
  '✅  Auto-seeded database — ready to demo instantly',
]
achievements.forEach(a => {
  doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(a, 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.35)
})

doc.moveDown(0.5)
sectionHeader('Project Statistics', INDIGO)
tableRow(['Metric', 'Value', 'Metric', 'Value'], [140, 80, 140, 80], true)
;[
  ['Total Pages', '18', 'API Endpoints', '30+'],
  ['DB Collections', '7', 'Tech Libraries', '20+'],
  ['Reusable Components', '7', 'Lines of Code', '~8,000'],
  ['File Formats', '9', 'Max File Size', '10 MB'],
  ['Exam Types', '6', 'Material Types', '5'],
  ['JWT Expiry', '24 hours', 'OTP Expiry', '5 minutes'],
].forEach(r => tableRow(r, [140, 80, 140, 80]))

doc.moveDown(0.6)
sectionHeader('Impact', BLUE)
const finalImpacts = [
  'Replaces physical registers → digital, searchable, never lost',
  'Students track their own attendance anytime from anywhere',
  'Automatic 75% shortage alert prevents exam detainment surprises',
  'Previous year papers available 24/7 — no more asking seniors for notes',
  'Admin manages hundreds of records in minutes instead of hours',
]
finalImpacts.forEach(s => {
  doc.rect(46, doc.y + 3, 5, 5).fill(BLUE)
  doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(s, 58, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.3)
})

// ── Finalize ──────────────────────────────────────────────────
doc.end()
console.log(`\n✅  PDF created: ${outputPath}\n`)
