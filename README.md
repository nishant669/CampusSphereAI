# CampusSphere AI — Smart College Management & Placement Portal

CampusSphere AI extends the original MERN College Academic Management Portal with an academic-resource hub, placement practice links, teacher assignment publishing/student submissions/grading, and a server-side LLM chatbot.

## Existing capabilities retained
- Admin, Professor and Student roles with protected routes
- Student and professor management, subjects, marks and attendance
- Study material uploads and downloads
- JWT authentication, password hashing and email OTP reset
- Dashboards and attendance warnings

## Added in CampusSphere AI
1. **Campus Hub** available to Admin, Professor and Student roles.
2. **RGPV PYQ directory links** with subject/branch/semester/year search on the linked archive sites. These are independent archives, not official RGPV services; verify syllabus and exam notices on RGPV's official website.
3. **Placement preparation** links for TCS, Infosys, Wipro, Accenture, Capgemini and Cognizant, plus LeetCode, GFG, HackerRank, CodeChef, Codeforces and IndiaBIX.
4. **Assignments**: Admin/Professor can publish an assignment with due date and optional attachment; Students can upload submissions; teachers can review and grade submissions (0–100 with feedback).
5. **CampusSphere AI chatbot**: calls a Groq-compatible OpenAI API from the backend. API keys are never sent to the browser.

## Technology
- Frontend: React 18, Vite, Tailwind CSS, React Router
- Backend: Node.js 18+, Express, MongoDB, Mongoose
- Auth: JWT + bcryptjs
- LLM: Groq-compatible Chat Completions API (optional)

## Setup

### 1. Requirements
- Node.js 18 or newer (Node 20 LTS recommended)
- npm 9+
- MongoDB local instance or MongoDB Atlas

### 2. Backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and configure:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/college_portal
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=24h
FRONTEND_URL=http://localhost:5173
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=change_this_password
```
Optional email OTP settings: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`.

Optional AI settings:
```env
GROQ_API_KEY=your_new_groq_api_key
LLM_API_URL=https://api.groq.com/openai/v1/chat/completions
LLM_MODEL=llama-3.3-70b-versatile
```
Get a new key from your provider dashboard. Do not reuse a key that was pasted into a chat, committed, or shared. Never add `.env` to Git.

Start:
```bash
npm run dev
```
The API runs at `http://localhost:5000`.

### 3. Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## Login accounts
The original project's seed script creates initial demo accounts. Check `backend/seed/index.js` for the configured demo credentials and change all default passwords before any public deployment. Do not deploy demo credentials.

## Using the new modules
- Sign in as Student, Professor or Admin and open **CampusSphere AI** from the sidebar.
- **Learning resources** contains RGPV paper archive links and placement/coding practice resources.
- **Assignments**: Admin/Professor publishes; Student submits a file; Admin/Professor views submissions and grades them.
- **AI assistant**: add `GROQ_API_KEY` to `backend/.env`, restart backend, then ask a question in the AI assistant tab. Without a key, the rest of the portal works and the chatbot displays a setup message.

## New API endpoints
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/assignments` | Authenticated | List assignments |
| POST | `/api/assignments` | Admin/Professor | Publish assignment (multipart form, optional `file`) |
| POST | `/api/assignments/:id/submit` | Student | Submit file |
| GET | `/api/assignments/:id/submissions` | Admin/Professor | Review submissions |
| PATCH | `/api/assignments/submissions/:submissionId/grade` | Admin/Professor | Grade submission |
| POST | `/api/ai/chat` | Authenticated | LLM chat |

## Important notes
- File uploads use the existing Multer configuration and file-size/type restrictions. The configured upload directory must be writable.
- This is a project starter, not a security-audited production deployment. Add stronger per-subject/semester authorization, malware scanning, audit logs, backups, and deployment secrets management before production.
- RGPV question paper sites linked in the portal are independent educational archives. They may change their URLs or paper availability. The portal does not claim affiliation with RGPV and does not invent direct PDF URLs for papers that have not been verified.
